export default async function handler(req, res) {
  const { property } = req.query;
  const projectId = "startup-up-realestate";
  
  // 1. ลิงก์โลโก้บริษัท (กรณีหาบ้านไม่เจอหรือระบบขัดข้อง)
  const logoImage = "https://res.cloudinary.com/dm2wr55r5/image/upload/v1772615014/LOGO_%E0%B9%80%E0%B8%82%E0%B8%B5%E0%B8%A2%E0%B8%A7%E0%B8%AB%E0%B8%A5%E0%B8%B1%E0%B8%87%E0%B8%82%E0%B8%B2%E0%B8%A7_zhoefm.jpg";
  
  let image = logoImage;
  let title = "STARTUP UP - จุดเริ่มต้นของคนอยากมีบ้าน";
  let desc = "ค้นหาบ้าน ทาวน์เฮาส์ บ้านเดี่ยว ทำเลดี พร้อมบริการสินเชื่อ";

  if (property) {
    try {
      const collectionPath = "artifacts/startup-up-realestate/public/data/properties";
      const dbUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}?pageSize=100`;

      const response = await fetch(dbUrl);
      const result = await response.json();

      if (result.documents) {
        const searchTarget = decodeURIComponent(property).toLowerCase().trim();
        
        const doc = result.documents.find(d => {
          const f = d.fields;
          const customId = (f.custom_id?.stringValue || "").toLowerCase().trim();
          const houseNo = (f.house_number?.stringValue || "").toLowerCase().trim();
          const docId = d.name.split('/').pop().toLowerCase().trim();
          
          return customId === searchTarget || 
                 houseNo === searchTarget || 
                 docId === searchTarget ||
                 customId === searchTarget.replace(/\//g, '-') ||
                 houseNo.replace(/\//g, '-') === searchTarget;
        });

        if (doc) {
          const f = doc.fields;
          title = `${f.project_name?.stringValue || "บ้านสวยพร้อมอยู่"} | STARTUP UP`;
          desc = `ทาวน์เฮาส์/บ้านเดี่ยว ทำเล ${f.subdistrict?.stringValue || ""} ราคา ${Number(f.price?.integerValue || f.price?.doubleValue || 0).toLocaleString()} บาท`;
          
          // --- จุดสำคัญ: ดึงรูปภาพจาก images ลำดับที่ 0 ---
          // ตรวจสอบว่ามีฟิลด์ images และมีข้อมูลใน Array หรือไม่
          if (f.images && f.images.arrayValue && f.images.arrayValue.values && f.images.arrayValue.values.length > 0) {
            // ดึงค่า stringValue จากตำแหน่งที่ [0] ตามที่คุณต้องการ
            image = f.images.arrayValue.values[0].stringValue;
          } else if (f.imageUrl && f.imageUrl.stringValue) {
            // ถ้า images ว่าง ให้ดึงจาก imageUrl สำรอง
            image = f.imageUrl.stringValue;
          }
        }
      }
    } catch (e) {
      console.error("Firestore Fetch Error:", e);
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${desc}" />
      <meta property="og:image" content="${image}" />
      <meta property="og:image:secure_url" content="${image}" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://startupuprealestate.vercel.app/?property=${encodeURIComponent(property)}" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image">
      <script>
        window.location.href = "/?property=${encodeURIComponent(property)}";
      </script>
    </head>
    <body style="background: #f8faf9; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; margin: 0;">
      <div style="text-align: center;">
        <img src="${logoImage}" style="width: 80px; margin-bottom: 20px;" />
        <p style="color: #0b3d1b;">กำลังพาคุณไปชมโครงการ...</p>
      </div>
    </body>
    </html>
  `);
}
