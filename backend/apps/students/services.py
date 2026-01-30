from django.core.exceptions import ValidationError
from django.db.models import Count, F
from .models import StudentProfile, Team, Cohort, StudentPreference


class TeamMatchingService:
    def __init__(self, cohort=None):
        if cohort:
            self.cohort = cohort
        else:
            from apps.common.utils import get_current_cohort
            self.cohort = get_current_cohort()

    def assign_solo_projects(self, student_ids):
        """
        Admin manually assigns students to solo projects
        Students do NOT request this themselves
        """
        if not self.cohort.allow_solo_projects:
            raise ValidationError("Solo projects not enabled for this cohort.")

        for student_id in student_ids:
            student = StudentProfile.objects.get(id=student_id)

            if student.cohort != self.cohort:
                continue

            # Create solo team
            solo_team = Team.objects.create(
                name=f"{student.user.first_name} {student.user.last_name}'s Project",
                cohort=self.cohort,
                is_solo=True,
                target_size=1,
                status="solo",
                creation_method="solo_assignment",
                is_locked=True,
            )

            # Assign student
            student.team = solo_team
            student.assignment_status = "solo_assigned"
            student.is_solo = True
            student.save()

    def auto_match_students(self, pref_size=None):
        """
        Main auto-matching algorithm
        Returns list of created teams
        """
        import networkx as nx

        # Get unassigned students searching for a team
        students = list(StudentProfile.objects.filter(
            cohort=self.cohort, team__isnull=True, seeking_team=True
        ))
        
        if not students:
            return []

        # Load preferences
        preferences = StudentPreference.objects.filter(
            student__in=students, 
            preferred_student__in=students
        ).select_related('student', 'preferred_student')

        # Build Graph
        G = nx.Graph()
        G.add_nodes_from([s.id for s in students])
        
        # Add edges for preferences (weighted by rank)
        # Rank 1 = highest preference = highest weight
        for pref in preferences:
             # Simple weighting: 4 - rank (assuming max rank 3)
             weight = max(1, 4 - pref.rank)
             if G.has_edge(pref.student.id, pref.preferred_student.id):
                 # If mutual, boost weight
                 G[pref.student.id][pref.preferred_student.id]['weight'] += weight
             else:
                 G.add_edge(pref.student.id, pref.preferred_student.id, weight=weight)

        # Determine strategy
        strategy = self.cohort.auto_matching_strategy
        
        teams_created = []
        
        # Use provided pref_size or cohort default
        target_size = pref_size if pref_size else self.cohort.max_team_size
        min_size = self.cohort.min_team_size

        if strategy == "preference_based":
            # Connected Components approach for "cliques"
            components = list(nx.connected_components(G))
            # Sort by size (largest cliques first) but we prioritize matching them
            # This is a heuristic. For a robust solution, we might want max weight matching per team size
            # But connected components is a good approximation for "groups wanting to be together"
            
            # Simple approach: Break down components into teams
            remaining_nodes = set(G.nodes())
            
            for component in components:
                comp_nodes = list(component)
                # Keep only those still available (unlikely to change in this loop but good practice)
                comp_nodes = [n for n in comp_nodes if n in remaining_nodes]
                
                if not comp_nodes:
                    continue

                # If component fits in one team
                if len(comp_nodes) <= target_size:
                    if len(comp_nodes) >= min_size:
                         # Make a team
                         team_students = [s for s in students if s.id in comp_nodes]
                         team = self._create_team(team_students, len(team_students), "auto_matched")
                         teams_created.append(team)
                         remaining_nodes.difference_update(comp_nodes)
                    else:
                         # Too small component, leave for cleanup distribution or merge?
                         # For now, put them in "buckets" to be merged later
                         pass 
                else:
                    # Component too big, split it
                    # Logic to split large connected component:
                    # 1. Recursive spectral bisection or just chunking?
                    # Let's simple chunk for now to avoid complexity without heavy deps (scipy etc)
                    # Better: Pick a node, traverse BFS until size is reached.
                    
                    subgraph = G.subgraph(comp_nodes)
                    while len(subgraph.nodes) >= min_size:
                         # Pick a high degree node to start
                         start_node = sorted(subgraph.degree, key=lambda x: x[1], reverse=True)[0][0]
                         bfs_tree = nx.bfs_tree(subgraph, start_node)
                         
                         candidates = list(bfs_tree.nodes())[:target_size]
                         if len(candidates) < min_size:
                             break # Should not happen if loop condition met
                             
                         team_students = [s for s in students if s.id in candidates]
                         team = self._create_team(team_students, len(team_students), "auto_matched")
                         teams_created.append(team)
                         remaining_nodes.difference_update(candidates)
                         
                         subgraph = G.subgraph([n for n in subgraph.nodes if n not in candidates])
                         if len(subgraph.nodes) == 0:
                             break

            # Handle remaining/unassigned/small components
            leftover_ids = list(remaining_nodes)
            if leftover_ids:
                 teams_created.extend(self._distribute_simple(leftover_ids, target_size, min_size))

        else:
            # Balanced or other strategies: Ignore graph structure and just distribute
            # to minimize variance in team size
            all_ids = [s.id for s in students]
            teams_created.extend(self._distribute_simple(all_ids, target_size, min_size))

        return teams_created

    def _distribute_simple(self, student_ids, target_size, min_size):
        """Standard distribution logic for non-preference matching or leftovers"""
        students = StudentProfile.objects.filter(id__in=student_ids)
        if not students.exists():
            return []
            
        count = len(students)
        teams = []
        students_list = list(students)
        
        # Calculate optimal number of teams to avoid leftovers < min_size
        # Ideally, every team should have between min_size and target_size
        
        # Greedy chunking
        while len(students_list) >= min_size:
            # Check if taking target_size leaves a valid remainder
            rem = len(students_list) - target_size
            
            take = target_size
            if rem < min_size and rem > 0:
                 # If remainder is too small, reduce current batch to save some for next
                 # or take all if it fits in max_team_size (which it might not)
                 # Better: Distribute e.g. 5 and 2 -> 3 and 4
                 
                 # Simple fix: If we are near the end, split evenly
                 total_remaining = len(students_list)
                 if total_remaining <= self.cohort.max_team_size:
                     take = total_remaining # Just one big team if allowed
                 else:
                     # Split into two balanced teams
                     take = total_remaining // 2
            
            batch = students_list[:take]
            students_list = students_list[take:]
            
            team = self._create_team(batch, len(batch), "auto_matched")
            teams.append(team)
            
            if not students_list:
                break
                
        # If any very small remainder (should only happen if count < min_size originally)
        if students_list:
             # Force into last created team if possible?
             if teams:
                 last_team = teams[-1]
                 if last_team.current_size + len(students_list) <= self.cohort.max_team_size:
                     for s in students_list:
                         last_team.add_member(s)
                 else:
                     # Must create undersized team
                     team = self._create_team(students_list, len(students_list), "auto_matched")
                     teams.append(team)
             else:
                 # Only one undersized team possible
                 team = self._create_team(students_list, len(students_list), "auto_matched")
                 teams.append(team)
                 
        return teams

    def _create_team(self, students, target_size, method="auto_matched"):
        """Create team and assign students"""
        team_num = Team.objects.filter(cohort=self.cohort).count() + 1
        team = Team.objects.create(
            name=f"Team {team_num}",
            cohort=self.cohort,
            target_size=target_size,
            creation_method=method,
        )

        for student in students:
            student.team = team
            student.assignment_status = "in_team"
            student.save()

        team.update_status()
        return team

    def finalize_cohort(self):
        """
        Finalize all teams in cohort:
        1. Auto-match remaining students
        2. Lock complete teams
        3. Dissolve incomplete teams
        """
        # 1. Auto-match remaining
        self.auto_match_students()

        # 2. Lock complete teams
        Team.objects.filter(cohort=self.cohort, status="complete").update(
            is_locked=True, status="locked"
        )

        # 3. Dissolve incomplete teams (if fewer than min_team_size)
        incomplete = Team.objects.filter(cohort=self.cohort, status="forming")
        
        count_dissolved = 0
        for team in incomplete:
            if team.current_size < self.cohort.min_team_size:
                team.members.all().update(team=None, assignment_status="unassigned")
                team.delete()
                count_dissolved += 1
                
        return count_dissolved
