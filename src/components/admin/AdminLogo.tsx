import Image from "next/image";

export default function AdminLogo() {
  return (
    <div className="admin-brand">
      <Image src="/images/logo.png" alt="" width={42} height={42} priority />
      <span>Arab Poets CMS</span>
    </div>
  );
}
