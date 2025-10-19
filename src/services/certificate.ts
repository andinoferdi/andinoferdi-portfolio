import { type CertificateData } from "@/types/certificate";

export const getCertificateData = (): CertificateData => {
  return {
    certificates: [
      {
        id: "cert-1",
        image: "/images/certificates/1.jpg",
      },
    ],
  };
};

