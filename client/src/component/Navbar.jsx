import { useAppContext } from "../utils/context";

export const Navbar = () => {
  const { account } = useAppContext();
  const truncateAddress = (addr) => {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "Not Connected";
  };
  return (
    <section className="text-white font-semibold p-3 border-b-2 border-b-[#C4FF5A] flex flex-row justify-between items-center">
      <h1 className="font-elianto tracking-widest text-lg">DRIVE3</h1>
      <h2 title={account}>
        Connected Account :{" "}
        <span className="font-roboto tracking-wide">
          {truncateAddress(account)}
        </span>
      </h2>
    </section>
  );
};
