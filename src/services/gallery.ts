import { type GalleryData, type GalleryItem } from "@/types/gallery";

export const getGalleryData = (): GalleryData => {
  const items: GalleryItem[] = [
    {
      id: "1",
      title: "Mt Lorokan - 2025",
      src: "/images/self/1.png",
    },
    {
      id: "2",
      title: "Mt Cendono - 2025",
      src: "/images/self/2.png",
    },
    {
      id: "3",
      title: "Mt Penanggungan - 2025",
      src: "/images/self/3.png",
    },
    {
      id: "4",
      title: "Ngalur Beach - 2025",
      src: "/images/self/4.png",
    },
    {
      id: "5",
      title: "Gallery Photo 1",
      src: "/images/gallery/1.jpg",
    },
    {
      id: "6",
      title: "Gallery Photo 2",
      src: "/images/gallery/2.jpg",
    },
    {
      id: "7",
      title: "Gallery Photo 3",
      src: "/images/gallery/3.jpg",
    },
    {
      id: "8",
      title: "Gallery Photo 4",
      src: "/images/gallery/4.jpg",
    },
    {
      id: "9",
      title: "Gallery Photo 5",
      src: "/images/gallery/5.jpg",
    },
    {
      id: "10",
      title: "Gallery Photo 6",
      src: "/images/gallery/6.jpg",
    },
    {
      id: "11",
      title: "Gallery Photo 7",
      src: "/images/gallery/7.jpg",
    },
    {
      id: "12",
      title: "Gallery Photo 8",
      src: "/images/gallery/8.jpg",
    },
    {
      id: "13",
      title: "Gallery Photo 9",
      src: "/images/gallery/9.jpg",
    },
    {
      id: "14",
      title: "Gallery Photo 10",
      src: "/images/gallery/10.jpg",
    },
    {
      id: "15",
      title: "Gallery Photo 11",
      src: "/images/gallery/11.jpg",
    },
    {
      id: "16",
      title: "Gallery Photo 12",
      src: "/images/gallery/12.jpg",
    },
    {
      id: "17",
      title: "Gallery Photo 13",
      src: "/images/gallery/13.jpg",
    },
    {
      id: "18",
      title: "Gallery Photo 14",
      src: "/images/gallery/14.jpg",
    },
    {
      id: "19",
      title: "Gallery Photo 15",
      src: "/images/gallery/15.jpg",
    },
    {
      id: "20",
      title: "Gallery Photo 16",
      src: "/images/gallery/16.jpg",
    },
    {
      id: "21",
      title: "Gallery Photo 17",
      src: "/images/gallery/17.jpg",
    },
    {
      id: "22",
      title: "Gallery Photo 18",
      src: "/images/gallery/18.jpg",
    },
    {
      id: "23",
      title: "Gallery Photo 19",
      src: "/images/gallery/19.jpg",
    },
    {
      id: "24",
      title: "Gallery Photo 20",
      src: "/images/gallery/20.jpg",
    },
    {
      id: "25",
      title: "Gallery Photo 21",
      src: "/images/gallery/21.jpg",
    },
    {
      id: "26",
      title: "Gallery Photo 22",
      src: "/images/gallery/22.jpg",
    },
    {
      id: "27",
      title: "Gallery Photo 23",
      src: "/images/gallery/23.jpg",
    },
    {
      id: "28",
      title: "Gallery Photo 24",
      src: "/images/gallery/24.jpg",
    },
    {
      id: "29",
      title: "Gallery Photo 25",
      src: "/images/gallery/25.jpg",
    },
    {
      id: "30",
      title: "Gallery Photo 26",
      src: "/images/gallery/26.jpg",
    },
    {
      id: "31",
      title: "Gallery Photo 27",
      src: "/images/gallery/27.jpg",
    },
    {
      id: "32",
      title: "Gallery Photo 28",
      src: "/images/gallery/28.jpg",
    },
    {
      id: "33",
      title: "Gallery Photo 29",
      src: "/images/gallery/29.jpg",
    },
    {
      id: "34",
      title: "Gallery Photo 30",
      src: "/images/gallery/30.jpg",
    },
    {
      id: "35",
      title: "Gallery Photo 31",
      src: "/images/gallery/31.jpg",
    },
    {
      id: "36",
      title: "Gallery Photo 32",
      src: "/images/gallery/32.jpg",
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

