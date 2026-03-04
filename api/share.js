export default async function handler(req, res) {
  const { property } = req.query; // ค่าที่ส่งมาจะเป็น ID หรือ custom_id เช่น 46-51

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

      // 3. ปรับการค้นหา: ให้หาจาก custom_id หรือ id ตามโค้ดใหม่ของคุณ
      const doc = result.documents?.find(d => {
        const fields = d.fields;
        const dbCustomId = fields.custom_id?.stringValue;
        // ดึง ID ของเอกสารจาก Firestore (ชื่อท้ายสุดของชื่อพาธ)
        const dbDocId = d.name.split('/').pop();
        
        // เทียบกับค่าที่ส่งมาใน URL
        return dbCustomId === property || dbDocId === property;
      });

      if (doc) {
        const f = doc.fields;
        const projectName = f.project_name?.stringValue || "บ้านสวยคัดสรรมาแล้ว";
        const price = Number(f.price?.integerValue || f.price?.doubleValue || 0).toLocaleString();
        const subdistrict = f.subdistrict?.stringValue || "";
        const category = f.category?.stringValue || "บ้าน";
        const houseNo = f.house_number?.stringValue || "";

        title = `${projectName} ${houseNo} | STARTUP UP`;
        desc = `${category} ทำเล ${subdistrict} ราคาเพียง ${price} บาท - จุดเริ่มต้นของคนอยากมีบ้าน`;
        
        // การดึงรูปภาพ
        if (f.images && f.images.arrayValue && f.images.arrayValue.values) {
          image = f.images.arrayValue.values[0].stringValue;
        } else if (f.imageUrl && f.imageUrl.stringValue) {
          image = f.imageUrl.stringValue;
        }
      }
    } catch (error) {
      console.error("Error fetching Firestore:", error);
    }
  }

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
        window.location.href = "/?property=${encodeURIComponent(property)}";
      </script>
    </head>
    <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8faf9;">
      <p style="color: #0b3d1b;">กำลังพาคุณไปชมโครงการ...</p>
    </body>
    </html>
  `);
}
