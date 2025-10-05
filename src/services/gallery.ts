import { type GalleryData, type GalleryItem } from "@/types/gallery";

export const getGalleryData = (): GalleryData => {
  const items: GalleryItem[] = [
    {
      id: "1",
      title: "Mt Lorokan",
      src: "/images/self/1.png",
    },
    {
      id: "2",
      title: "Mt Cendono", 
      src: "/images/self/2.png",
    },
    {
      id: "3",
      title: "Mt Penanggungan",
      src: "/images/self/3.png", 
    },
    {
      id: "4",
      title: "Ngalur Beach",
      src: "/images/self/4.png",
    },

  ];

  

  return {
    items,
  };
};

export const searchGalleryItems = (query: string): GalleryItem[] => {
  const data = getGalleryData();
  const lowercaseQuery = query.toLowerCase();
  
  return data.items.filter(item => 
    item.title.toLowerCase().includes(lowercaseQuery) 
  );
};

