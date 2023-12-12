import { useQuery } from "@tanstack/react-query";
import React from "react";
import { getMessages } from "../utils/http";
import Message from "../components/Message";

const Messages = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["messages"],
    queryFn: getMessages,
  });

  return (
    <div className='p-10'>
      <p className='text-center text-2xl font-bold'>All Messages</p>
      <div className='flex flex-col gap-2 '>
        {isLoading && <div>Loading chats...</div>}
        {data &&
          data.map((message, i) => (
            <Message
              key={i}
              message={message}
            />
          ))}
      </div>
    </div>
  );
};

export default Messages;
