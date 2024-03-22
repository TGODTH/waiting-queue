import React, { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { useParams } from "react-router-dom";
import { IClinicQueue } from "../interface/queue";

function QueuePage() {
  const { clinic } = useParams();
  const [pageStatus, setPageStatus] = useState<"Loading" | "Error" | "Done">(
    "Loading"
  );
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [clinicQueue, setClinicQueue] = useState<IClinicQueue | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const columnCount = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--column-count"
    ),
    10
  );
  const columnGap = Math.abs(
    parseFloat(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--column-gap")
        .replace("px", "")
    )
  );
  const displayedQueue =
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--row-count"
      ),
      10
    ) - 4;
  const changePageDelay =
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--change-page-delay"
      ),
      10
    ) - 3;

  useEffect(() => {
    function onConnect() {
      setPageStatus("Loading");
      setIsConnected(true);
    }

    function onDisconnect() {
      setPageStatus("Loading");
      setIsConnected(false);
    }

    function onQueueUpdate(updatedClinicQueue: IClinicQueue | null) {
      setClinicQueue(updatedClinicQueue);
      setPageStatus("Done");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("queues updated", onQueueUpdate);
    socket.on("error", (error) => {
      setError(error);
      setPageStatus("Error");
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("queues updated", onQueueUpdate);
      socket.off("error", onQueueUpdate);
    };
  }, []);

  useEffect(() => {
    setPageStatus("Loading");
    if (isConnected) socket.emit("set clinicName", clinic?.toUpperCase());
  }, [isConnected, clinic]);

  useEffect(() => {
    let containerAnimation: number | null = null;

    if (containerRef.current) {
      const moveLeft = () => {
        if (containerRef.current) {
          const docterCount = Array.from(containerRef.current.children).length;
          const oneStepPX = window.innerWidth + columnGap;
          const positionFromLeft = getComputedStyle(
            containerRef.current
          ).getPropertyValue("left");
          let positionFromLeftPX = Math.abs(
            parseFloat(positionFromLeft.replace("px", ""))
          );
          positionFromLeftPX =
            positionFromLeftPX / oneStepPX >=
            Math.floor(docterCount / columnCount) - 1
              ? 0
              : positionFromLeftPX + oneStepPX;
          containerRef.current.style.left = "-" + positionFromLeftPX + "px";
        }
      };
      containerAnimation = setInterval(moveLeft, changePageDelay);
    }

    return () => {
      if (containerAnimation) clearInterval(containerAnimation);
    };
  }, [clinicQueue]);

  if (pageStatus === "Done")
    return (
      <div className="queue-container" ref={containerRef}>
        {clinicQueue ? (
          <>
            {clinicQueue.docters.map((doctor) => {
              const docterQueue = clinicQueue.queues.filter(
                (queue) => queue.Doctor === doctor.doctor
              );

              return (
                <div key={doctor.doctor} className="docter-column">
                  <div className="flex-cell diag-room">{doctor.DiagRoom}</div>
                  <div className="flex-cell docter-name">
                    <p className="docter-name-text">{doctor.DoctorName}</p>
                  </div>
                  <div className="flex-cell docter-time">
                    {doctor.time1.split(" , ").map((time, index) => (
                      <React.Fragment key={"docterTime-" + index}>
                        {index !== 0 ? <br /> : ""} {time}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="flex-cell vn-header">VN</div>

                  {[...Array(displayedQueue)].map((_, queueIndex) => {
                    return docterQueue[queueIndex] ? (
                      <div
                        key={doctor.doctor + queueIndex}
                        className={`flex-cell queue${
                          docterQueue[queueIndex].In ? " has-in" : ""
                        }`}
                      >
                        <div className="vn-xl-container">
                          <span className="queue-vn">
                            {docterQueue[queueIndex].Vn}
                          </span>

                          <span className="queue-xl">
                            {docterQueue[queueIndex].XL}
                          </span>
                        </div>
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
            {clinicQueue.docters.length < 5 ||
            (clinicQueue.docters.length / columnCount) % 1 != 0
              ? [
                  ...Array(
                    Math.ceil(clinicQueue.docters.length / columnCount) *
                      columnCount -
                      clinicQueue.docters.length
                  ),
                ].map((_, column_index) => (
                  <div key={column_index} className="docter-column empty">
                    {[...Array(displayedQueue + 4)].map((_, queueIndex) => (
                      <div key={queueIndex} className="flex-cell"></div>
                    ))}
                  </div>
                ))
              : ""}
          </>
        ) : (
          "Loading"
        )}
      </div>
    );
  if (pageStatus === "Loading")
    return <p className="alert-text loading">Loading</p>;
  return (
    <p className="alert-text error">
      Error: {error ? error.message : "Unexpected Error"}
    </p>
  );
}

export default QueuePage;
