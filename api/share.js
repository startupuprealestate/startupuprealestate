export default async function handler(req, res) {
  const { property } = req.query;
  const projectId = "startup-up-realestate";
  
  // 1. เปลี่ยนรูป Default เป็นรูปที่ Bot อ่านง่าย (ห้ามใช้ลิงก์ Google Drive แบบธรรมดา)
  // แนะนำให้ฝากรูปโลโก้ไว้ที่ Firebase Storage หรือใช้รูปที่โฮสต์บนที่อื่นที่ไม่ใช่ Google Drive
  let title = "STARTUP UP - จุดเริ่มต้นของคนอยากมีบ้าน";
  let desc = "ค้นหาบ้าน ทาวน์เฮาส์ บ้านเดี่ยว ทำเลดี พร้อมบริการสินเชื่อ";
  let image = "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80"; // รูปสำรองชั่วคราว

  if (property) {
    try {
      const collectionPath = "artifacts/startup-up-realestate/public/data/properties";
      const dbUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}?pageSize=100`;

      const response = await fetch(dbUrl);
      const result = await response.json();

      if (result.documents) {
        const decodedProp = decodeURIComponent(property).toLowerCase();
        
        const doc = result.documents.find(d => {
          const f = d.fields;
          const customId = (f.custom_id?.stringValue || "").toLowerCase();
          const houseNo = (f.house_number?.stringValue || "").toLowerCase();
          const docId = d.name.split('/').pop().toLowerCase();
          
          // ค้นหาจากทั้ง ID กำหนดเอง, เลขที่บ้าน, และ ID ระบบ
          return customId === decodedProp || houseNo === decodedProp || 
                 customId === decodedProp.replace(/\//g, '-') || docId === decodedProp;
        });

        if (doc) {
          const f = doc.fields;
          const name = f.project_name?.stringValue || "บ้านสวยพร้อมอยู่";
          const pVal = f.price?.integerValue || f.price?.doubleValue || 0;
          const sub = f.subdistrict?.stringValue || "";
          const hNo = f.house_number?.stringValue || "";

          title = `${name} | บ้านเลขที่ ${hNo}`;
          desc = `ทาวน์เฮาส์/บ้านเดี่ยว ทำเล ${sub} ราคา ${Number(pVal).toLocaleString()} บาท - STARTUP UP`;
          
          // 2. ดึงรูปภาพ (สำคัญ: ถ้าเป็นลิงก์ Google Drive ต้องแปลงเป็น Direct Link)
          let rawImg = "";
          if (f.images?.arrayValue?.values?.length > 0) {
            rawImg = f.images.arrayValue.values[0].stringValue;
          } else if (f.imageUrl?.stringValue) {
            rawImg = f.imageUrl.stringValue;
          }

          if (rawImg) {
            // ถ้าเป็นลิงก์ Google Drive ให้พยายามแปลงเป็น Direct Link
            if (rawImg.includes("drive.google.com")) {
              const fileId = rawImg.split('id=')[1] || rawImg.split('/d/')[1]?.split('/')[0];
              image = `https://lh3.googleusercontent.com/d/${fileId}=w1200`;
            } else {
              image = rawImg;
            }
          }
        }
      }
    } catch (e) { console.error(e); }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${desc}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:type" content="website" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image">
        <script>window.location.href = "/?property=${encodeURIComponent(property)}";</script>
      </head>
      <body></body>
    </html>
  `);
}
