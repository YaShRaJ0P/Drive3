import React from "react";
import { useSelector } from "react-redux";

export const Navbar = () => {
  const address = useSelector((state) => state.address);
  const truncateAddress = (addr) => {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "Not Connected";
  };
  return (
    <section className="text-white font-semibold p-3 border-b-2 border-b-[#C4FF5A] flex flex-row justify-between items-center">
      <h1>DRIVE3</h1>
      <h2>Connected Account : {truncateAddress(address)}</h2>
    </section>
  );
};
