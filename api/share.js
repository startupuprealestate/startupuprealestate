export default async function handler(req, res) {
  const { property } = req.query;

  // 1. ข้อมูลเริ่มต้น (ใช้โลโก้แบรนด์ STARTUP UP)
  let title = "STARTUP UP - จุดเริ่มต้นของคนอยากมีบ้าน";
  let desc = "ค้นหาบ้าน ทาวน์เฮาส์ บ้านเดี่ยว ทำเลดี พร้อมบริการสินเชื่อ";
  let image = "https://drive.google.com/uc?export=view&id=1_CeuqQ7b0UgssGmBp_IqP_i1Og16UAXn"; 

  if (property) {
    try {
      const projectId = "startup-up-realestate";
      const collectionPath = "artifacts/startup-up-realestate/public/data/properties";
      const dbUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}`;

      const response = await fetch(dbUrl);
      const result = await response.json();

      // 3. ค้นหาเอกสารที่มี house_number ตรงกับค่า property
      const doc = result.documents?.find(d => {
        const fields = d.fields;
        return fields.house_number?.stringValue === property;
      });

      if (doc) {
        const f = doc.fields;
        const projectName = f.project_name?.stringValue || "บ้านสวยคัดสรรมาแล้ว";
        const price = Number(f.price?.integerValue || f.price?.doubleValue || 0).toLocaleString();
        const subdistrict = f.subdistrict?.stringValue || "";
        const category = f.category?.stringValue || "บ้าน";

        title = `${projectName} | STARTUP UP`;
        desc = `บ้านเลขที่ ${property} ทำเล ${subdistrict} ราคาเพียง ${price} บาท - จุดเริ่มต้นของคนอยากมีบ้าน`;
        
        // --- จุดที่ปรับปรุง: การดึงรูปภาพแบบละเอียด ---
        if (f.images && f.images.arrayValue && f.images.arrayValue.values) {
          // กรณีมีหลายรูป ให้เอารูปแรก
          image = f.images.arrayValue.values[0].stringValue;
        } else if (f.imageUrl && f.imageUrl.stringValue) {
          // กรณีมีรูปเดียวในช่อง imageUrl
          image = f.imageUrl.stringValue;
        }
      }
    } catch (error) {
      console.error("Error fetching Firestore:", error);
    }
  }

  // 4. แสดงผล Meta Tags สำหรับ Social Media
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${desc}" />
      <meta property="og:image" content="${image}" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://${req.headers.host}/?property=${encodeURIComponent(property)}" />
      <meta name="twitter:card" content="summary_large_image">
      
      <script>
        // ส่งคนไปยังหน้าเว็บหลักของคุณ
        window.location.href = "/?property=${encodeURIComponent(property)}";
      </script>
    </head>
    <body style="font-family: 'Prompt', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8faf9; color: #0b3d1b;">
      <div style="text-align: center;">
        <p>กำลังพาคุณไปชมโครงการ ${property}...</p>
      </div>
    </body>
    </html>
  `);
}
