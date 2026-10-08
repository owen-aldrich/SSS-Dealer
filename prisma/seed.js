// =============================================================
// Prisma Seed — SSS+Dealer
// Isi data 18 mobil ke database PostgreSQL
// Jalankan: npm run db:seed
// =============================================================

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const cars = [
  {
    name: "296 GTB",
    brand: "Ferrari",
    type: "Sports Car",
    price: 5168000000,
    image: "images/cars/ferrari-296-gtb.jpg",
    drivetrain: "RWD",
    powertrain: "Hybrid",
    transmission: "Automatic",
    performance: "Supercar",
    horsepower: 819,
    torque: 740,
    topSpeed: 330,
    accel0100: "2.9s",
    description:
      "Ferrari 296 GTB memadukan mesin V6 twin-turbo dengan motor listrik, menghasilkan tenaga besar dengan respons instan khas hybrid performa tinggi.",
  },
  {
    name: "Revuelto",
    brand: "Lamborghini",
    type: "Sports Car",
    price: 8272000000,
    image: "images/cars/lamborghini-revuelto.jpg",
    drivetrain: "AWD",
    powertrain: "Hybrid",
    transmission: "Automatic",
    performance: "Hypercar",
    horsepower: 1015,
    torque: 725,
    topSpeed: 350,
    accel0100: "2.5s",
    description:
      "Lamborghini Revuelto adalah V12 hybrid pertama dari Sant'Agata, menggabungkan raungan mesin klasik dengan tenaga elektrik untuk akselerasi luar biasa.",
  },
  {
    name: "911 GT3",
    brand: "Porsche",
    type: "Sports Car",
    price: 3420000000,
    image: "images/cars/porsche-911-gt3.jpg",
    drivetrain: "RWD",
    powertrain: "Petrol",
    transmission: "Automatic",
    performance: "Track",
    horsepower: 510,
    torque: 470,
    topSpeed: 318,
    accel0100: "3.4s",
    description:
      "Porsche 911 GT3 dirancang murni untuk performa sirkuit, dengan mesin naturally aspirated yang responsif dan handling presisi tinggi.",
  },
  {
    name: "M8 Competition",
    brand: "BMW",
    type: "Grand Tourer",
    price: 2133000000,
    image: "images/cars/bmw-m8.jpg",
    drivetrain: "AWD",
    powertrain: "Petrol",
    transmission: "Automatic",
    performance: "GT",
    horsepower: 617,
    torque: 750,
    topSpeed: 305,
    accel0100: "3.2s",
    description:
      "BMW M8 Competition menghadirkan kemewahan grand tourer dengan performa mobil sport, cocok untuk perjalanan jauh maupun trek.",
  },
  {
    name: "AMG GT",
    brand: "Mercedes-Benz",
    type: "Sports Car",
    price: 1898000000,
    image: "images/cars/mercedes-amg-gt.jpg",
    drivetrain: "RWD",
    powertrain: "Petrol",
    transmission: "Automatic",
    performance: "Sports",
    horsepower: 469,
    torque: 600,
    topSpeed: 285,
    accel0100: "3.9s",
    description:
      "Mercedes-AMG GT menawarkan proporsi klasik front-engine sports car dengan karakter suara mesin V8 yang khas.",
  },
  {
    name: "R8",
    brand: "Audi",
    type: "Sports Car",
    price: 2538000000,
    image: "images/cars/audi-r8.jpg",
    drivetrain: "AWD",
    powertrain: "Petrol",
    transmission: "Automatic",
    performance: "Supercar",
    horsepower: 570,
    torque: 550,
    topSpeed: 324,
    accel0100: "3.2s",
    description:
      "Audi R8 adalah supercar naturally aspirated V10 dengan sistem quattro all-wheel drive yang memberikan traksi maksimal.",
  },
  {
    name: "720S",
    brand: "McLaren",
    type: "Sports Car",
    price: 4784000000,
    image: "images/cars/mclaren-720s.jpg",
    drivetrain: "RWD",
    powertrain: "Petrol",
    transmission: "Automatic",
    performance: "Supercar",
    horsepower: 710,
    torque: 770,
    topSpeed: 341,
    accel0100: "2.9s",
    description:
      "McLaren 720S menggunakan sasis carbon-fibre monocage dan aerodinamika aktif untuk downforce optimal di kecepatan tinggi.",
  },
  {
    name: "MC20",
    brand: "Maserati",
    type: "Sports Car",
    price: 3468000000,
    image: "images/cars/maserati-mc20.jpg",
    drivetrain: "RWD",
    powertrain: "Petrol",
    transmission: "Automatic",
    performance: "Supercar",
    horsepower: 630,
    torque: 730,
    topSpeed: 325,
    accel0100: "2.9s",
    description:
      "Maserati MC20 lahir dari pengalaman balap Maserati, dengan mesin Nettuno V6 buatan sendiri yang ringan dan bertenaga.",
  },
  {
    name: "Urus",
    brand: "Lamborghini",
    type: "SUV",
    price: 3700000000,
    image: "images/cars/lamborghini-urus.jpg",
    drivetrain: "AWD",
    powertrain: "Petrol",
    transmission: "Automatic",
    performance: "SUV",
    horsepower: 657,
    torque: 850,
    topSpeed: 305,
    accel0100: "3.6s",
    description:
      "Lamborghini Urus membuktikan SUV bisa memiliki jiwa supercar, dengan ruang kabin luas namun performa yang tetap galak.",
  },
  {
    name: "Purosangue",
    brand: "Ferrari",
    type: "SUV",
    price: 6240000000,
    image: "images/cars/ferrari-purosangue.jpg",
    drivetrain: "AWD",
    powertrain: "Petrol",
    transmission: "Automatic",
    performance: "SUV",
    horsepower: 725,
    torque: 716,
    topSpeed: 310,
    accel0100: "3.3s",
    description:
      "Ferrari Purosangue adalah interpretasi Ferrari terhadap SUV performa tinggi, tetap mempertahankan DNA sports car sejati.",
  },
  {
    name: "RS6 Avant",
    brand: "Audi",
    type: "Wagon",
    price: 1870000000,
    image: "images/cars/audi-rs6.jpg",
    drivetrain: "AWD",
    powertrain: "Petrol",
    transmission: "Automatic",
    performance: "Sports",
    horsepower: 600,
    torque: 800,
    topSpeed: 305,
    accel0100: "3.6s",
    description:
      "Audi RS6 Avant menggabungkan praktisitas mobil wagon dengan tenaga twin-turbo V8 yang buas, cocok untuk keluarga yang menyukai kecepatan.",
  },
  {
    name: "GranTurismo Trofeo",
    brand: "Maserati",
    type: "Grand Tourer",
    price: 2950000000,
    image: "images/cars/maserati-granturismo.jpg",
    drivetrain: "RWD",
    powertrain: "Petrol",
    transmission: "Automatic",
    performance: "GT",
    horsepower: 542,
    torque: 650,
    topSpeed: 320,
    accel0100: "3.5s",
    description:
      "Maserati GranTurismo Trofeo menawarkan grand touring elegan dengan tenaga besar dan interior mewah khas Italia.",
  },
  {
    name: "Aventador SVJ",
    brand: "Lamborghini",
    type: "Sports Car",
    price: 8284000000,
    image: "images/cars/lamborghini-aventador-svj.jpg",
    drivetrain: "AWD",
    powertrain: "Petrol",
    transmission: "Automatic",
    performance: "Hypercar",
    horsepower: 770,
    torque: 720,
    topSpeed: 350,
    accel0100: "2.8s",
    description:
      "Lamborghini Aventador SVJ adalah puncak dari era V12 naturally aspirated Lamborghini, dengan aerodinamika ALA yang agresif.",
  },
  {
    name: "G 63 AMG",
    brand: "Mercedes-Benz",
    type: "SUV",
    price: 2897000000,
    image: "images/cars/mercedes-g63.jpg",
    drivetrain: "AWD",
    powertrain: "Petrol",
    transmission: "Automatic",
    performance: "SUV",
    horsepower: 585,
    torque: 850,
    topSpeed: 240,
    accel0100: "4.5s",
    description:
      "Mercedes-AMG G 63 memadukan siluet off-road ikonik G-Class dengan jantung V8 AMG yang bertenaga besar.",
  },
  {
    name: "AMG GT 63 S",
    brand: "Mercedes-Benz",
    type: "Grand Tourer",
    price: 3026000000,
    image: "images/cars/mercedes-amg-gt63.jpg",
    drivetrain: "AWD",
    powertrain: "Petrol",
    transmission: "Automatic",
    performance: "GT",
    horsepower: 630,
    torque: 900,
    topSpeed: 315,
    accel0100: "2.9s",
    description:
      "Mercedes-AMG GT 63 S menghadirkan performa sedan empat pintu dengan akselerasi setara mobil sport dua pintu.",
  },
  {
    name: "M4 Competition",
    brand: "BMW",
    type: "Sports Car",
    price: 1378000000,
    image: "images/cars/bmw-m4.jpg",
    drivetrain: "RWD",
    powertrain: "Petrol",
    transmission: "Automatic",
    performance: "Sports",
    horsepower: 503,
    torque: 650,
    topSpeed: 290,
    accel0100: "3.5s",
    description:
      "BMW M4 Competition adalah coupe sport klasik BMW dengan keseimbangan sempurna antara handling presisi dan tenaga besar.",
  },
  {
    name: "X6 M Competition",
    brand: "BMW",
    type: "SUV",
    price: 1910000000,
    image: "images/cars/bmw-x6m.jpg",
    drivetrain: "AWD",
    powertrain: "Petrol",
    transmission: "Automatic",
    performance: "SUV",
    horsepower: 617,
    torque: 750,
    topSpeed: 290,
    accel0100: "3.8s",
    description:
      "BMW X6 M Competition menawarkan gaya SUV coupe dengan performa M Division yang membuatnya terasa seperti mobil sport.",
  },
  {
    name: "P1",
    brand: "McLaren",
    type: "Sports Car",
    price: 21600000000,
    image: "images/cars/mclaren-p1.jpg",
    drivetrain: "RWD",
    powertrain: "Hybrid",
    transmission: "Automatic",
    performance: "Hypercar",
    horsepower: 916,
    torque: 900,
    topSpeed: 350,
    accel0100: "2.8s",
    description:
      "McLaren P1 adalah hypercar hybrid legendaris yang menggabungkan mesin twin-turbo V8 dengan motor listrik untuk performa tanpa kompromi.",
  },
];

// Variasi status + tahun untuk tampilan admin (indeks → status).
// Default "available" untuk sisanya.
const STATUS_OVERRIDES = {
  3: "sold",     // index 3
  7: "reserved", // index 7
  12: "draft",   // index 12
};

// Lead contoh untuk dashboard admin "Kelola Lead"
const leads = [
  { name: "Owen Aldrich S", phone: "081234567890", email: "owen.aldrich@email.com", carName: "911 GT3",       status: "contacted",   consultant: "Rani Putri" },
  { name: "Dimas Pratama",  phone: "081298765432", email: "dimas.pratama@email.com", carName: "911 GT3",       status: "new",         consultant: null },
  { name: "Nadia Putri",    phone: "081355501122", email: "nadia.putri@email.com",   carName: "M4 Competition", status: "negotiation", consultant: "Rani Putri" },
  { name: "Kevin Wijaya",   phone: "081744433221", email: "kevin.wijaya@email.com",  carName: "AMG GT 63 S",    status: "new",         consultant: null },
  { name: "Sarah Tan",      phone: "081288899900", email: "sarah.tan@email.com",     carName: "M4 Competition", status: "contacted",   consultant: "Arif Hidayat" },
  { name: "Bima Santoso",   phone: "081366677788", email: "bima.santoso@email.com",  carName: "296 GTB",        status: "closing",     consultant: "Arif Hidayat" },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Upsert setiap mobil berdasarkan name + brand (aman dijalankan ulang)
  for (let i = 0; i < cars.length; i++) {
    const car = { ...cars[i], year: 2024, status: STATUS_OVERRIDES[i] || "available" };
    await prisma.car.upsert({
      where: {
        id: (await prisma.car.findFirst({ where: { name: car.name, brand: car.brand } }))?.id ?? 0,
      },
      update: car,
      create: car,
    });
  }
  console.log(`✅ ${cars.length} cars seeded successfully.`);

  // Seed leads (hapus dulu agar tidak dobel saat dijalankan ulang)
  await prisma.lead.deleteMany({});
  for (const lead of leads) {
    const car = await prisma.car.findFirst({ where: { name: lead.carName } });
    await prisma.lead.create({
      data: {
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        carId: car ? car.id : null,
        status: lead.status,
        consultant: lead.consultant,
      },
    });
  }
  console.log(`✅ ${leads.length} leads seeded successfully.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
