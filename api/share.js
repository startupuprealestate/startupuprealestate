export default async function handler(req, res) {
  const { property } = req.query;

  // 1. ข้อมูลเริ่มต้น (กรณีหาบ้านไม่เจอ หรือลิงก์ปกติ)
  let title = "STARTUP UP - จุดเริ่มต้นของคนอยากมีบ้าน";
  let desc = "ค้นหาบ้าน ทาวน์เฮาส์ บ้านเดี่ยว ทำเลดี พร้อมบริการสินเชื่อ";
  let image = "https://drive.google.com/uc?export=view&id=1_CeuqQ7b0UgssGmBp_IqP_i1Og16UAXn"; // รูปโลโก้หลักของคุณ

  if (property) {
    try {
      // 2. ดึงข้อมูลจาก Firestore ผ่าน REST API (ไม่ต้องใช้ Firebase SDK)
      const projectId = "startup-up-realestate";
      const collectionPath = "artifacts/startup-up-realestate/public/data/properties";
      const dbUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}`;

      const response = await fetch(dbUrl);
      const result = await response.json();

      // 3. ค้นหาเอกสารที่มี house_number ตรงกับค่า property ใน URL
      const doc = result.documents?.find(d => {
        const fields = d.fields;
        // เทียบค่า house_number (ในฐานข้อมูลคุณเก็บเป็น String)
        return fields.house_number?.stringValue === property;
      });

      if (doc) {
        const f = doc.fields;
        const projectName = f.project_name?.stringValue || "บ้านสวยทำเลดี";
        const price = Number(f.price?.integerValue || f.price?.doubleValue || 0).toLocaleString();
        const subdistrict = f.subdistrict?.stringValue || "";
        const category = f.category?.stringValue || "บ้าน";

        // ปรับแต่ง Title และ Description ให้สวยงาม
        title = `${projectName} (บ้านเลขที่ ${property}) | STARTUP UP`;
        desc = `${category} ทำเล ${subdistrict} ราคาเพียง ${price} บาท - จุดเริ่มต้นของคนอยากมีบ้าน`;
        
        // ดึงรูปภาพแรกจาก Array 'images' หรือรูปจาก 'imageUrl'
        image = f.images?.arrayValue?.values?.[0]?.stringValue || f.imageUrl?.stringValue || image;
      }
    } catch (error) {
      console.error("Error fetching Firestore:", error);
    }
  }

  // 4. พ่น HTML พิเศษออกไปให้ Bot (Facebook/Line) อ่าน Meta Tags
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
    <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
      <p>กำลังพาท่านไปที่หน้าโครงการ...</p>
    </body>
    </html>
  `);
}
