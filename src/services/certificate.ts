import { type CertificateData } from "@/types/certificate";

export const getCertificateData = (): CertificateData => {
  return {
    certificates: [
      {
        id: "cert-1",
        images: ["/images/certificates/1.jpg"],
      },
      {
        id: "cert-2",
        images: ["/images/certificates/2.jpg"],
      },
      {
        id: "cert-3",
        images: [
          "/images/certificates/3.jpg",
          "/images/certificates/4.jpg",
        ],
      },
    ],
  };
};

