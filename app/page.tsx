import LeadForm from "@/components/LeadForm";

export default function Home() {
  const clinicName = process.env.CLINIC_NAME ?? "xyz_clinic";
  const clinicCity = process.env.CLINIC_CITY ?? "Bengaluru";

  return <LeadForm clinicName={clinicName} clinicCity={clinicCity} />;
}
