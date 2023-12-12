/* eslint-disable react/prop-types */
import React from "react";

const Message = (props) => {
  const { message } = props;
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex justify-between text-lg font-semibold'>
        <h1>{message.username || "Not available"}</h1>
        <h1>{message.contact}</h1>
      </div>
      <div>{message.message}</div>
      <div>{message.groupName}</div>
    </div>
  );
};

export default Message;
