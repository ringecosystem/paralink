import FooterSocials from './footer-socials';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <div className="container flex h-full items-center justify-between">
      <span className="text-[12px] font-normal leading-normal text-[#12161950]">
        Copyright © {currentYear} All Rights Reserved.
      </span>
      <FooterSocials />
    </div>
  );
}
