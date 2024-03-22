interface IQueue {
  Doctor: string;
  Vn: string;
  Ack: string;
  RunNo: number;
  In: string;
  XL: string;
}

interface IDocter {
  doctor: string;
  DoctorName: string;
  DiagRoom: string;
  time1: string;
}

interface IClinicQueue {
  docters: IDocter[];
  queues: IQueue[];
}

export type { IClinicQueue };
