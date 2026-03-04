export default async function handler(req, res) {
  const { property } = req.query;
  const projectId = "startup-up-realestate";
  const defaultImage = "https://drive.google.com/uc?export=view&id=1_CeuqQ7b0UgssGmBp_IqP_i1Og16UAXn";

  let title = "STARTUP UP - จุดเริ่มต้นของคนอยากมีบ้าน";
  let desc = "ค้นหาบ้าน ทาวน์เฮาส์ บ้านเดี่ยว ทำเลดี พร้อมบริการสินเชื่อ";
  let image = defaultImage;

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
          
          // ตรวจสอบทุกช่องทางที่อาจจะเป็นไปได้
          return customId === decodedProp || houseNo === decodedProp || docId === decodedProp;
        });

        if (doc) {
          const f = doc.fields;
          const name = f.project_name?.stringValue || "บ้านสวยพร้อมอยู่";
          const pVal = f.price?.integerValue || f.price?.doubleValue || 0;
          const sub = f.subdistrict?.stringValue || "";
          const hNo = f.house_number?.stringValue || "";

          title = `${name} (${hNo}) | STARTUP UP`;
          desc = `ทำเล ${sub} ราคา ${Number(pVal).toLocaleString()} บาท - จุดเริ่มต้นของคนอยากมีบ้าน`;
          
          // ดึงรูป: ลองดูทุกช่องทางที่อาจจะเก็บรูปไว้
          if (f.images?.arrayValue?.values?.length > 0) {
            image = f.images.arrayValue.values[0].stringValue;
          } else if (f.imageUrl?.stringValue) {
            image = f.imageUrl.stringValue;
          }
        }
      }
    } catch (e) { console.error(e); }
  }

  // ส่ง HTML พร้อม Meta Tags แบบสมบูรณ์
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`
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
        <meta name="twitter:image" content="${image}">
        <script>window.location.href = "/?property=${encodeURIComponent(property)}";</script>
      </head>
      <body></body>
    </html>
  `);
}
