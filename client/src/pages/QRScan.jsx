import React, { useEffect, useState } from "react";
import { createWhatsappServer, getQRCode } from "../utils/http";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const QRScan = () => {
  const [qr, setQR] = useState(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    const eventSource = new EventSource("/api/createSession", {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      //   const data = JSON.parse(event.data);

      console.log(event);
      if (event.data === "Scan QR") {
        setQR("/api/qr/out.png");
        setIsLoading(false);
      }

      if (event.data === "Login success") {
        navigate("/messages");
        eventSource.close();
      }
      //   if (data.message) {
      //     setMessage(data.message);
      //   } else if (data.update) {
      //     console.log('Received update:', data.update);
      //     // Handle other types of updates as needed
      //   }
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error Type:", error.type);
      console.error("SSE Error Message:", error.message);
      console.error("SSE Error Target:", error.target);
      console.error("SSE Error URL:", error.target.url);
      eventSource.close();
    };

    setIsLoading(false);
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <>
      {qr ? (
        <div className='flex flex-col items-center justify-center gap-1 mt-16'>
          <img src={qr} />
          <p className='text-center font-medium'>
            scan this QR code to continue
          </p>
        </div>
      ) : (
        <h1 className='text-center mt-16'>Checking User status...</h1>
      )}
      <div className='flex flex-col text-lg items-center font-bold justify-center gap-1 mt-4'>
        <p>{currentUser.username}</p>
        <p>{currentUser.email}</p>
      </div>
    </>
  );
};

export default QRScan;
