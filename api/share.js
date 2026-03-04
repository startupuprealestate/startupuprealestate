export default async function handler(req, res) {
  const { property } = req.query;
  const projectId = "startup-up-realestate";
  
  // 1. ใส่ลิงก์โลโก้จาก Cloudinary ของคุณตรงนี้
  let image = "https://res.cloudinary.com/dm2wr55r5/image/upload/v1/logo-startupup.png"; 
  let title = "STARTUP UP - จุดเริ่มต้นของคนอยากมีบ้าน";
  let desc = "ค้นหาบ้าน ทาวน์เฮาส์ บ้านเดี่ยว ทำเลดี พร้อมบริการสินเชื่อ";

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
          return customId === decodedProp || houseNo === decodedProp || docId === decodedProp;
        });

        if (doc) {
          const f = doc.fields;
          const name = f.project_name?.stringValue || "บ้านสวยพร้อมอยู่";
          const pVal = f.price?.integerValue || f.price?.doubleValue || 0;
          const sub = f.subdistrict?.stringValue || "";
          const hNo = f.house_number?.stringValue || "";

          title = `${name} | บ้านเลขที่ ${hNo}`;
          desc = `ทาวน์เฮาส์/บ้านเดี่ยว ทำเล ${sub} ราคา ${Number(pVal).toLocaleString()} บาท - STARTUP UP`;
          
          // 2. ดึงรูปภาพจาก Cloudinary (ดึงจากช่อง images หรือ imageUrl)
          if (f.images && f.images.arrayValue && f.images.arrayValue.values && f.images.arrayValue.values.length > 0) {
            image = f.images.arrayValue.values[0].stringValue;
          } else if (f.imageUrl && f.imageUrl.stringValue) {
            image = f.imageUrl.stringValue;
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
