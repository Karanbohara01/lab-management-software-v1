export type AppointmentStatus = 'SCHEDULED' | 'CHECKED_IN' | 'CONVERTED' | 'CANCELLED' | 'NO_SHOW';

/** A test the visit is expected to need. Deliberately carries no price — see AppointmentEstimate. */
export interface AppointmentTestLine {
  testId: number;
  testCode: string;
  testName: string;
  departmentName: string;
  quantity: number;
}

export interface AppointmentListItem {
  id: number;
  appointmentNumber: string;
  patientId: number;
  patientName: string;
  patientMrn: string;
  branchId: number | null;
  branchName: string | null;
  referringDoctorId: number | null;
  referringDoctorName: string | null;
  status: AppointmentStatus;
  scheduledAt: string;
  testCount: number;
}

export interface AppointmentDetail {
  id: number;
  appointmentNumber: string;
  patientId: number;
  patientName: string;
  patientMrn: string;
  branchId: number | null;
  branchName: string | null;
  referringDoctorId: number | null;
  referringDoctorName: string | null;
  status: AppointmentStatus;
  scheduledAt: string;
  reason: string | null;
  checkedInAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  convertedAt: string | null;
  convertedOrderId: number | null;
  convertedOrderNumber: string | null;
  items: AppointmentTestLine[];
}

export interface SaveAppointmentPayload {
  patientId: number;
  referringDoctorId?: number | null;
  branchId?: number | null;
  scheduledAt: string;
  reason?: string;
  items?: { testId: number; quantity: number }[];
}

export const APPOINTMENT_STATUS_TONE: Record<AppointmentStatus, 'neutral' | 'info' | 'success' | 'danger' | 'warning'> = {
  SCHEDULED: 'info',
  CHECKED_IN: 'warning',
  CONVERTED: 'success',
  CANCELLED: 'danger',
  NO_SHOW: 'neutral',
};

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Scheduled',
  CHECKED_IN: 'Checked in',
  CONVERTED: 'Converted to order',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No-show',
};
