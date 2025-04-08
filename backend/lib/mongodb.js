// นำเข้า mongoose สำหรับเชื่อมต่อกับ MongoDB
import mongoose from 'mongoose';

// ดึงค่าตัวแปรแวดล้อมสำหรับเชื่อมต่อฐานข้อมูล
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'default_db'; // สามารถตั้งค่าชื่อฐานข้อมูลได้

// ตรวจสอบว่ามีการกำหนดค่า MONGODB_URI หรือไม่
if (!MONGODB_URI) {
    throw new Error('กรุณากำหนดค่าตัวแปร MONGODB_URI ในไฟล์ .env.local');
}

// ใช้ตัวแปร global เพื่อเก็บสถานะการเชื่อมต่อฐานข้อมูล
let cached = global.mongoose;

// ถ้ายังไม่มีค่า ให้กำหนดค่าเริ่มต้นเป็น null
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

// ฟังก์ชันสำหรับเชื่อมต่อฐานข้อมูล MongoDB
async function dbConnect() {
    // ถ้ามีการเชื่อมต่อฐานข้อมูลอยู่แล้ว ให้ใช้การเชื่อมต่อนั้น
    if (cached.conn) {
        console.log('✅ ใช้การเชื่อมต่อฐานข้อมูลเดิม');
        return cached.conn;
    }

    // ถ้ายังไม่มี Promise สำหรับการเชื่อมต่อ ให้สร้างใหม่
    if (!cached.promise) {
        const options = {
            dbName: DB_NAME, // กำหนดชื่อฐานข้อมูล
            bufferCommands: false, // ปิดการใช้บัฟเฟอร์คำสั่ง
            useNewUrlParser: true, // ใช้พาร์เซอร์ตัวใหม่ของ MongoDB
            useUnifiedTopology: true, // ใช้การจัดการการเชื่อมต่อแบบใหม่
            maxPoolSize: 10, // จำกัดจำนวนการเชื่อมต่อสูงสุด
            serverSelectionTimeoutMS: 5000, // รอเลือกเซิร์ฟเวอร์ไม่เกิน 5 วินาที
            socketTimeoutMS: 45000, // ปิด socket หลังไม่มีการใช้งาน 45 วินาที
        };

        // ตั้งค่า strictQuery เป็น false เพื่อรองรับเวอร์ชันใหม่
        mongoose.set('strictQuery', false);

        // สร้างการเชื่อมต่อกับฐานข้อมูลและบันทึกใน cache
        cached.promise = mongoose.connect(MONGODB_URI, options).then((mongoose) => {
            console.log(`✅ เชื่อมต่อฐานข้อมูลสำเร็จ: ${DB_NAME}`);
            return mongoose;
        });
    }

    try {
        // รอให้การเชื่อมต่อสำเร็จ
        cached.conn = await cached.promise;
    } catch (error) {
        // ถ้าเชื่อมต่อไม่สำเร็จ ให้ล้างค่า Promise และแสดงข้อผิดพลาด
        cached.promise = null;
        console.error('❌ การเชื่อมต่อฐานข้อมูลล้มเหลว:', error);
        throw error;
    }

    // คืนค่าการเชื่อมต่อฐานข้อมูล
    return cached.conn;
}

// ส่งออกฟังก์ชัน dbConnect สำหรับใช้ในโปรเจกต์
export default dbConnect;
