import FooterSocials from './footer-socials';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <div className="mx-auto flex h-full items-center justify-between px-[40px]">
      <span className="text-[12px] font-normal leading-normal text-[#121619]">
        © {currentYear} Paralink Powerd by RingDAO
      </span>
      <FooterSocials />
    </div>
  );
}
