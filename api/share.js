export default async function handler(req, res) {
  const { property } = req.query;
  const projectId = "startup-up-realestate";
  // ต้องใส่ API Key เพื่อให้ Fetch ข้อมูลผ่าน REST API ได้ 100% ไม่ถูกบล็อก
  const apiKey = "AIzaSyDsEeGxKA90-URCn06F-K3U2dvlISf_2Jo";
  
  // 1. ลิงก์โลโก้บริษัท (กรณีหาบ้านไม่เจอหรือระบบขัดข้อง)
  const logoImage = "https://res.cloudinary.com/dm2wr55r5/image/upload/v1772615014/LOGO_%E0%B9%80%E0%B8%82%E0%B8%B5%E0%B8%A2%E0%B8%A7%E0%B8%AB%E0%B8%A5%E0%B8%B1%E0%B8%87%E0%B8%82%E0%B8%B2%E0%B8%A7_zhoefm.jpg";
  
  let image = logoImage;
  let title = "STARTUP UP - จุดเริ่มต้นของคนอยากมีบ้าน";
  let desc = "ค้นหาบ้าน ทาวน์เฮาส์ บ้านเดี่ยว ทำเลดี พร้อมบริการสินเชื่อ";

  if (property) {
    try {
      const collectionPath = "artifacts/startup-up-realestate/public/data/properties";
      // แนบ &key= ต่อท้าย URL ตรงนี้สำคัญมาก
      const dbUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}?pageSize=100&key=${apiKey}`;

      const response = await fetch(dbUrl);
      const result = await response.json();

      if (result.documents) {
        // ดักจับกรณี Vercel ส่ง Query มาเป็น Array
        const propStr = Array.isArray(property) ? property[0] : property;
        const searchTarget = decodeURIComponent(propStr).toLowerCase().trim();
        
        const doc = result.documents.find(d => {
          const f = d.fields || {};
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
          
          // ดึงรูปภาพจาก images ลำดับที่ 0
          if (f.images && f.images.arrayValue && f.images.arrayValue.values && f.images.arrayValue.values.length > 0) {
            image = f.images.arrayValue.values[0].stringValue;
          } else if (f.imageUrl && f.imageUrl.stringValue) {
            image = f.imageUrl.stringValue;
          }
        }
      }
    } catch (e) {
      console.error("Firestore Fetch Error:", e);
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // บอก Facebook ให้จดจำแคชไว้ 1 วัน
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); 
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
      <meta property="og:url" content="https://startupuprealestate.vercel.app/?property=${encodeURIComponent(Array.isArray(property) ? property[0] : property)}" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image">
      <script>
        // ใช้ replace เพื่อให้ผู้ใช้กด Back กลับไปแชทได้ ไม่ติดลูปหน้าขาว
        window.location.replace("/?property=${encodeURIComponent(Array.isArray(property) ? property[0] : property)}");
      </script>
    </head>
    <body style="background: #f8faf9; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; margin: 0;">
      <div style="text-align: center;">
        <img src="${logoImage}" style="width: 80px; margin-bottom: 20px; border-radius: 8px;" />
        <p style="color: #0b3d1b;">กำลังพาคุณไปชมโครงการ...</p>
      </div>
    </body>
    </html>
  `);
}
