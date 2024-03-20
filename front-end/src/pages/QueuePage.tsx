import React, { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { useParams } from "react-router-dom";
import { IClinicQueue } from "../interface/queue";

function QueuePage() {
  const { clinic } = useParams();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [clinicQueue, setClinicQueue] = useState<IClinicQueue | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onQueueUpdate(updatedClinicQueue: IClinicQueue | null) {
      setClinicQueue(updatedClinicQueue);
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
    if (isConnected) socket.emit("set clinicName", clinic?.toUpperCase());
  }, [isConnected, clinic]);

  useEffect(() => {
    let containerAnimation: number | null = null;
    if (containerRef.current) {
      const columnCount = parseInt(
        getComputedStyle(containerRef.current).getPropertyValue(
          "--column-count"
        ),
        10
      );

      const moveLeft = () => {
        if (containerRef.current) {
          const docterCount = Array.from(containerRef.current.children).length;
          const oneStepPX = window.innerWidth / columnCount + 1;
          const positionFromLeft = getComputedStyle(
            containerRef.current
          ).getPropertyValue("left");
          let positionFromLeftPX = Math.abs(
            parseFloat(positionFromLeft.replace("px", ""))
          );
          positionFromLeftPX =
            docterCount - positionFromLeftPX / oneStepPX <= columnCount
              ? 0
              : positionFromLeftPX + oneStepPX;
          containerRef.current.style.left = "-" + positionFromLeftPX + "px";
        }
      };
      containerAnimation = setInterval(moveLeft, 5000);
    }

    return () => {
      if (containerAnimation) clearInterval(containerAnimation);
    };
  }, [clinicQueue]);

  const displayed_queue = 8;

  return (
    <div className="container" ref={containerRef}>
      {clinicQueue ? (
        <>
          {clinicQueue.docters.map((doctor) => {
            const docterQueue = clinicQueue.queues.filter(
              (queue) => queue.Doctor === doctor.doctor
            );

            return (
              <div key={doctor.doctor} className="docter-column">
                <div className="flex-cell diag-room">{doctor.DiagRoom}</div>
                <div className="flex-cell docter-name">{doctor.DoctorName}</div>
                <div className="flex-cell docter-time">
                  {doctor.time1.split(" , ").map((time, index) => (
                    <React.Fragment key={"docterTime-" + index}>
                      {index !== 0 ? <br /> : ""} {time}
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex-cell VN">VN</div>

                {[...Array(displayed_queue)].map((_, queueIndex) => {
                  return docterQueue[queueIndex] ? (
                    <div
                      key={doctor.doctor + queueIndex}
                      className={`flex-cell queue${
                        docterQueue[queueIndex].In ? " has-in" : ""
                      }`}
                    >
                      {docterQueue[queueIndex].Vn}
                    </div>
                  ) : (
                    <div
                      key={doctor.doctor + queueIndex}
                      className="flex-cell queue"
                    ></div>
                  );
                })}
              </div>
            );
          })}
          {clinicQueue.docters.length < 5
            ? [...Array(5 - clinicQueue.docters.length)].map(
                (_, column_index) => (
                  <div key={column_index} className="docter-column empty">
                    {[...Array(displayed_queue + 4)].map((_, queueIndex) => (
                      <div key={queueIndex} className="flex-cell"></div>
                    ))}
                  </div>
                )
              )
            : ""}
        </>
      ) : (
        "Loading"
      )}
    </div>
  );
}

export default QueuePage;
