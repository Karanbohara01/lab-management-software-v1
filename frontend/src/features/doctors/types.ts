export interface Doctor {
  id: number;
  fullName: string;
  specialization: string | null;
  qualification: string | null;
  nmcNumber: string | null;
  phone: string | null;
  email: string | null;
  affiliatedOrganization: string | null;
  active: boolean;
}

export interface DoctorUpsertPayload {
  fullName: string;
  specialization?: string;
  qualification?: string;
  nmcNumber?: string;
  phone?: string;
  email?: string;
  affiliatedOrganization?: string;
}
