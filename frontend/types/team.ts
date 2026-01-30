export interface Member {
    id: number;
    student_id: string;
    email: string;
    first_name: string;
    last_name: string;
    assignment_status: string;
}

export interface Team {
    id: number;
    name: string;
    cohort: number;
    members: Member[];
    member_count: number;
    current_size: number;
    remaining_slots: number;
    is_full: boolean;
    is_solo: boolean;
    target_size: number;
    status: string;
    creation_method: string;
    is_locked: boolean;
    created_at: string;
}

export interface StudentProfile {
    id: number;
    student_id: string;
    email: string;
    first_name: string;
    last_name: string;
    team: number | null;
    is_solo: boolean;
    cohort_id: number;
    cohort_teams_locked: boolean;
    assignment_status: string;
    seeking_team: boolean;
    has_team: boolean;
    skills: string[];
}
