export interface Member {
    id: number;
    student_id: string;
    email: string;
    first_name: string;
    last_name: string;
}

export interface Team {
    id: number;
    name: string;
    cohort: number;
    members: Member[];
    member_count: number;
    created_at: string;
}
