import { useEffect, useState } from "react";
import { socket } from "../socket";
import { useParams } from "react-router-dom";
import { IDocter, IQueueRaw } from "../interface/queue";

function QueuePage() {
  const { clinic } = useParams();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [docters, setDocters] = useState<IDocter[]>([]);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onQueueUpdate(value: string) {
      const newQueues = JSON.parse(value);
      const docterList = [
        ...new Set(newQueues.map((queue: IQueueRaw) => queue.docter)),
      ] as string[];
      const docters = docterList.reduce((acc: IDocter[], docter: string) => {
        const _queueList = newQueues.filter(
          (queue: IQueueRaw) => queue.docter === docter
        ) as IQueueRaw[];
        return [
          ...acc,
          { name: docter, time: _queueList[0].time, queue: _queueList },
        ] as IDocter[];
      }, []);
      setDocters(docters);
      console.log(docters);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("queues updated", onQueueUpdate);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("queues updated", onQueueUpdate);
    };
  }, []);

  useEffect(() => {
    if (isConnected) socket.emit("set clinicName", clinic);
  }, [isConnected, clinic]);
  return (
    // TODO: UI
    <div>{docters.map((docter) => docter.queue.map((queue) => queue.VN))}</div>
  );
}

export default QueuePage;
