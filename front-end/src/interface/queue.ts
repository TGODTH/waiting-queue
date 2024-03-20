interface IDocter {
  name: string;
  time: string;
  queue: IQueue[];
}

interface IQueue {
  VN: string;
  XL: string;
  Ack: string;
  RunNo: number;
}

interface IQueueRaw {
  docter: string;
  time: string;
  VN: string;
  XL: string;
  Ack: string;
  RunNo: number;
}

export type { IDocter, IQueueRaw };
