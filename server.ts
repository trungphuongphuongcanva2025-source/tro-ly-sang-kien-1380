import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
}
dotenv.config();

// Define __dirname equivalent safely
let resolvedFilename = "";
try {
  resolvedFilename = fileURLToPath(import.meta.url);
} catch (e) {
  if (typeof __filename !== "undefined") {
    resolvedFilename = __filename;
  }
}
const resolvedDirname = resolvedFilename ? path.dirname(resolvedFilename) : process.cwd();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini client with proper header
let defaultAi: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  defaultAi = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function getAiClients(req: express.Request): GoogleGenAI[] {
  const customApiKeysStr = req.headers["x-api-keys"];
  const clients: GoogleGenAI[] = [];
  
  if (customApiKeysStr && typeof customApiKeysStr === "string") {
    try {
      const keys = JSON.parse(customApiKeysStr);
      if (Array.isArray(keys)) {
        for (const key of keys) {
          if (typeof key === "string" && key.trim() !== "") {
            clients.push(new GoogleGenAI({
              apiKey: key.trim(),
              httpOptions: { headers: { "User-Agent": "aistudio-build" } }
            }));
          }
        }
      }
    } catch(e) {
      // Ignore parse error
    }
  }
  
  if (clients.length === 0 && defaultAi) {
    clients.push(defaultAi);
  }
  
  return clients;
}

async function generateWithRetry(activeAiClients: GoogleGenAI[], options: any, retriesPerKey = 2, baseDelayMs = 5000) {
  if (!activeAiClients || activeAiClients.length === 0) {
    throw new Error("Không có API Key nào được định cấu hình. Vui lòng thêm trong Cài đặt.");
  }
  
  for (let i = 0; i < retriesPerKey; i++) {
    for (let clientIndex = 0; clientIndex < activeAiClients.length; clientIndex++) {
      try {
        return await activeAiClients[clientIndex].models.generateContent(options);
      } catch (error: any) {
        const errorMsg = error?.message || error?.toString() || "";
        const isRateLimit = error?.status === 429 || errorMsg.includes("429") || errorMsg.includes("Quota") || errorMsg.includes("RESOURCE_EXHAUSTED");
        
        if (isRateLimit) {
           console.warn(`[Rate Limit 429] Quota exceeded for key index ${clientIndex}. Trying next...`);
           
           if (clientIndex === activeAiClients.length - 1 && i < retriesPerKey - 1) {
             const jitter = Math.random() * 2000;
             console.warn(`All keys exhausted. Retrying in ${Math.round(baseDelayMs + jitter)}ms...`);
             await new Promise((resolve) => setTimeout(resolve, baseDelayMs + jitter));
             baseDelayMs *= 1.5;
           }
           continue; 
        }
        
        throw error;
      }
    }
  }
  throw new Error("Tất cả các API key đều đã quá tải (Lỗi 429). Vui lòng thử lại sau vài phút.");
}

// Keep a simple API status endpoint
app.get("/api/health", (req, res) => {
  const customApiKeyStr = req.headers["x-api-keys"];
  let hasCustom = false;
  try {
     const keys = JSON.parse(customApiKeyStr as string);
     hasCustom = Array.isArray(keys) && keys.some(k => typeof k === 'string' && k.trim() !== "");
  } catch(e) {}
  
  const hasKey = !!process.env.GEMINI_API_KEY || hasCustom;
  res.json({
    status: "ok",
    hasApiKey: hasKey,
    time: new Date().toISOString(),
  });
});

// STAGE 1: Suggest Names Endpoint
app.post("/api/suggest-names", async (req, res) => {
  const clients = getAiClients(req);
  if (clients.length === 0) {
    return res.status(500).json({
      error: "Không tìm thấy GEMINI_API_KEY. Vui lòng định cấu hình API Key trong phần cài đặt.",
    });
  }

  const { rawIdea, level, subject, targetStudents, coreProblem, goal, textbook, schoolLevel, schoolName, province } = req.body;

  if (!rawIdea || !subject || !coreProblem || !goal) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ các thông tin bắt buộc." });
  }

  try {
    const systemInstruction = `Bạn là "Trợ Lý Sáng Kiến 1380" — Chuyên gia hỗ trợ giáo viên viết sáng kiến giáo dục chất lượng cao áp dụng cho mọi cấp học (Tiểu học, THCS, THPT) trên phạm vi toàn quốc (tham khảo quy chuẩn Công văn số 1380/SGDĐT-VP ngày 11/3/2026 của Sở GD&ĐT cũng như các thông lệ thi đua cả nước).

QUY TẮC BẮT BUỘC KHI ĐỀ XUẤT TÊN SÁNG KIẾN:
- Tên sáng kiến phải ngắn gọn, rõ ràng, phù hợp nội dung, tuyệt đối không dùng cụm từ "Kinh nghiệm" hay "Một số kinh nghiệm".
- Phù hợp với cấp học hiện tại:
  + Tiểu học: Hướng tới sự gần gũi, ấm áp, trò chơi trải nghiệm, giản dị mà chuyên nghiệp.
  + THCS: Cân bằng giữa thực tiễn và lý thuyết, phát triển phẩm chất, năng lực và kỹ năng sống.
  + THPT: Mang tính học thuật sắc sảo, tư duy phản biện, định hướng nghề nghiệp hoặc tích hợp liên môn.
- Cấp tỉnh (CO_SO hoặc CAP_TINH): Thể hiện độ lan tỏa rộng rãi tại tỉnh/thành phố (${province || "địa phương"}), toàn ngành giáo dục hoặc nhiều đơn vị trường học liên kết.
- Cấp cơ sở: Tác động trong phạm vi lớp học, tổ chuyên môn hoặc trường học (${schoolName || "nhà trường"}).
- KHÔNG sử dụng ký tự lạ trong tên sáng kiến.

Mục tiêu chính: Phân tích ý tưởng thô và đề xuất chính xác 3 tên sáng kiến hay nhất, kèm lý do chi tiết, cấp độ phù hợp và điểm mạnh nổi bật. Gợi ý linh hoạt cả hai hướng nếu người dùng chọn "both".`;

    const userPrompt = `Hãy đề xuất tên sáng kiến giáo dục dựa trên các thông số sau:
- Ý tưởng thô: ${rawIdea}
- Môn học / Lĩnh vực: ${subject}
- Cấp học tác động: ${schoolLevel || "THCS"}
- Trường công tác: ${schoolName || "Trường học tại địa phương"}
- Tỉnh / Thành phố: ${province || "Tây Ninh"}
- Đối tượng tác động (học sinh): ${targetStudents}
- Vấn đề cốt lõi cần giải quyết: ${coreProblem}
- Mục tiêu đạt được: ${goal}
- Bộ sách giáo khoa chủ đạo hỗ trợ: ${textbook || "Kết nối tri thức với cuộc sống"}
- Cấp độ mong muốn: ${level === "both" ? "Cả hai cấp độ (Cơ sở & Tỉnh)" : level}

Hãy phân tích và trả về định dạng JSON thuần thúy theo cấu trúc của Schema như yêu cầu.`;

    const response = await generateWithRetry(clients, {
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["analysis", "suggestions"],
          properties: {
            analysis: {
              type: Type.OBJECT,
              required: ["subject", "target", "coreProblem", "goal"],
              properties: {
                subject: { type: Type.STRING, description: "Tóm tắt môn học hoặc lĩnh vực nghiên cứu" },
                target: { type: Type.STRING, description: "Tóm tắt đối tượng học sinh hướng tới" },
                coreProblem: { type: Type.STRING, description: "Phát biểu ngắn gọn vấn đề giáo dục cốt lõi cần giải quyết" },
                goal: { type: Type.STRING, description: "Mục tiêu then chốt của sáng kiến" },
              },
            },
            suggestions: {
              type: Type.ARRAY,
              description: "Danh sách đúng 3 đề xuất tên sáng kiến độc đáo",
              items: {
                type: Type.OBJECT,
                required: ["id", "name", "reason", "level", "strengths"],
                properties: {
                  id: { type: Type.STRING, description: "ID tự sinh dạng: name-1, name-2, name-3" },
                  name: { type: Type.STRING, description: "Tên sáng kiến được đề nghị (không có từ 'Kinh nghiệm')" },
                  reason: { type: Type.STRING, description: "Lý do vì sao tên này cực kỳ phù hợp" },
                  level: { type: Type.STRING, description: "Cấp độ phù hợp ('Cơ sở' hoặc 'Cấp tỉnh')" },
                  strengths: { type: Type.STRING, description: "Điểm mạnh nổi bật, thu hút giám khảo" },
                },
              },
            },
          },
        },
      },
    });

    const resultText = response.text || "{}";
    const parsedData = JSON.parse(resultText);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in suggest-names API:", error);
    res.status(500).json({ error: error.message || "Lỗi xử lý đề xuất tên sáng kiến." });
  }
});

// STAGE 2: Generate Detailed Initiative Endpoint
app.post("/api/generate-initiative", async (req, res) => {
  const clients = getAiClients(req);
  if (clients.length === 0) {
    return res.status(500).json({
      error: "Không tìm thấy GEMINI_API_KEY. Vui lòng định cấu hình API Key trong phần cài đặt.",
    });
  }

  const { title, level, inputData } = req.body;
  const sLevel = req.body.sLevel || inputData?.schoolLevel || "THCS";
  const sName = req.body.sName || inputData?.schoolName || "Trường học tại địa phương";
  const prov = req.body.prov || inputData?.province || "Tây Ninh";

  if (!title || !level || !inputData) {
    return res.status(400).json({ error: "Thiếu dữ liệu để tạo sáng kiến chi tiết." });
  }

  try {
    const baseSystemInstruction = `Bạn là "Trợ lý học thuật và Sáng tạo Sáng kiến CHỐNG AI MẠNH, Chuyên gia Soạn thảo Văn bản Hành chính Cấp cao".
QUY TẮC CHỐNG AI MẠNH & THỂ THỨC: 
- Trình bày chuẩn thể thức văn bản hành chính của Chính phủ (Nghị định 30/2020/NĐ-CP). Các tiêu đề lớn viết HOA in đậm.
- Văn phong giáo viên thực tế, giản dị, kể chuyện lớp học chân thực.
- Tuyệt đối giảm mỹ từ sáo rỗng. Dùng ngôn ngữ lập luận sư phạm sâu sắc.
- Dẫn chứng số liệu, ví dụ sinh động bám sát môn ${inputData.subject}.`;

    const generatePart = async (partInstruction: string, partPrompt: string) => {
      const response = await generateWithRetry(clients, {
        model: "gemini-3.5-flash",
        contents: partPrompt,
        config: {
          systemInstruction: baseSystemInstruction + "\n\n" + partInstruction,
        },
      });
      return response.text || "";
    };

    const instructionA = `YÊU CẦU ĐỊNH DẠNG: Viết CHUYÊN SÂU CỰC KỲ CHI TIẾT phần A. MỞ ĐẦU (Độ dài yêu cầu: Khoảng 2000 - 2500 từ).
BẮT BUỘC có các tiêu đề sau:
📝 NỘI DUNG SÁNG KIẾN: "${title}"
(Cấp đăng ký: ${level})

**A. MỞ ĐẦU**
**1. Tên sáng kiến**
- [Khẳng định trực tiếp tên sáng kiến chính thức]
**2. Sự cần thiết, mục đích của việc thực hiện sáng kiến**
- **2.1. Trình bày sự cần thiết**: [Phân tích bối cảnh đổi mới dạy học tại trường ${sName}, tỉnh ${prov}. Nêu khó khăn, bất cập cực kỳ chi tiết, dài khoảng 800 từ].
- **2.2. Mục đích của việc thực hiện sáng kiến**: [Phân tích chi tiết từng mục tiêu năng lực, phẩm chất, dài khoảng 500 từ].
**3. Đối tượng nghiên cứu (cần xác định rõ loại đối tượng)**
- Giáo viên, học sinh: [Xác định nhóm đối tượng]
- Các vấn đề đặt ra (chủ thể, khách thể)
**4. Phạm vi nghiên cứu**
- Trong lớp, nhóm lớp, đơn vị, trường học: [Phân tích tại trường ${sName}].
- Các đơn vị, trường học cùng loại hình nghiên cứu.
- Nghiên cứu ngoài tỉnh.
**5. Phương pháp nghiên cứu**
- Nghiên cứu tài liệu.
- Điều tra (dự giờ, thực nghiệm, trắc nghiệm, đàm thoại, kiểm tra, đối chiếu,…).`;

    const promptA = `Hãy viết phần A. MỞ ĐẦU cho sáng kiến:
- Tên sáng kiến: "${title}"
- Vấn đề cốt lõi: "${inputData.coreProblem}"
- Ý tưởng thô: "${inputData.rawIdea}"
YÊU CẦU: Viết cực kỳ chi tiết, đào sâu vào bối cảnh thực tiễn, độ dài 2000-2500 từ. KHÔNG được viết tóm tắt.`;

    const instructionB = `YÊU CẦU ĐỊNH DẠNG: Viết CHUYÊN SÂU CỰC KỲ CHI TIẾT phần B. NỘI DUNG (Độ dài yêu cầu: Khoảng 4000 - 5000 từ).
BẮT BUỘC có các tiêu đề sau:
**B. NỘI DUNG**
**1. Cơ sở lý luận**
- Các văn bản chỉ đạo Trung ương, địa phương, của ngành.
- Các quan niệm khác về giáo dục.
**2. Cơ sở thực tiễn**
- Thực tiễn vấn đề nghiên cứu tại trường ${sName}.
- Sự cần thiết của sáng kiến (Kèm bảng số liệu khảo sát thực trạng ban đầu).
**3. Nội dung vấn đề**
- Vấn đề đặt ra.
- Các giải pháp cụ thể: BẮT BUỘC TRÌNH BÀY 5 GIẢI PHÁP. Mỗi giải pháp (ví dụ 3.1, 3.2...) phải bao gồm: a) Mục tiêu; b) Nội dung; c) Cách thức thực hiện (CỰC KỲ DÀI, miêu tả tiến trình trên lớp, lời thoại, tình huống sư phạm, có ví dụ từ sách ${inputData.textbook || "Kết nối tri thức"}); d) Điều kiện thực hiện.
- Kết quả so sánh: (Kèm bảng số liệu đối sánh trước và sau khi áp dụng 5 giải pháp).
**4. Kết quả mang lại**
**5. Đánh giá về phạm vi ảnh hưởng của sáng kiến.**`;

    const promptB = `Hãy viết phần B. NỘI DUNG cho sáng kiến:
- Tên sáng kiến: "${title}"
- Vấn đề cốt lõi: "${inputData.coreProblem}"
- Mục tiêu: "${inputData.goal}"
YÊU CẦU: Tập trung tối đa vào 5 giải pháp. Viết thật dài, mỗi giải pháp phải trên 800 từ, có hội thoại và miêu tả chân thực. Tổng độ dài 4000-5000 từ.`;

    const instructionC = `YÊU CẦU ĐỊNH DẠNG: Viết CHUYÊN SÂU phần C, D, E (Độ dài yêu cầu: Khoảng 1000 - 1500 từ).
BẮT BUỘC có các tiêu đề sau:
**C. KẾT LUẬN**
**1. Bài học rút ra từ thực tiễn nghiên cứu của sáng kiến.**
**2. Hướng nghiên cứu tiếp của sáng kiến (nếu có)**
**D. NHẬN XÉT, ĐÁNH GIÁ VÀ XẾP LOẠI CỦA...**
- Hội đồng sáng kiến đơn vị, trường học:
**E. TÀI LIỆU THAM KHẢO, MỤC LỤC**
**1. Tài liệu tham khảo**
**2. Mục lục** (Lập mục lục tổng hợp từ Phần A đến E)`;

    const promptC = `Hãy viết phần C. KẾT LUẬN, D và E cho sáng kiến:
- Tên sáng kiến: "${title}"
- Tỉnh: "${prov}"
YÊU CẦU: Trình bày sâu sắc bài học kinh nghiệm cá nhân. Liệt kê tài liệu tham khảo thực tế và tạo Mục lục hoàn chỉnh tổng hợp các phần A, B, C, D, E.`;

    // Chạy song song 3 luồng để tăng tốc độ và đạt độ dài tối đa 22 trang
    const [partA, partB, partC] = await Promise.all([
      generatePart(instructionA, promptA),
      generatePart(instructionB, promptB),
      generatePart(instructionC, promptC)
    ]);

    const fullContent = `${partA}\n\n${partB}\n\n${partC}`;

    res.json({
      title: title,
      level: level,
      content: fullContent,
    });
  } catch (error: any) {
    console.error("Error in generate-initiative API:", error);
    res.status(500).json({ error: error.message || "Lỗi xử lý tạo sáng kiến chi tiết." });
  }
});

// STAGE 3: Refine & Expand Initiative Endpoint (4000 - 4500 words constraint)
app.post("/api/refine-initiative", async (req, res) => {
  const clients = getAiClients(req);
  if (clients.length === 0) {
    return res.status(500).json({
      error: "Không tìm thấy GEMINI_API_KEY. Vui lòng định cấu hình API Key trong phần cài đặt.",
    });
  }

  const { title, level, content, instruction, inputData } = req.body;

  if (!title || !level || !content || !instruction || !inputData) {
    return res.status(400).json({ error: "Thiếu dữ liệu để tinh chỉnh sáng kiến." });
  }

  const sLevel = inputData.schoolLevel || "THCS";
  const sName = inputData.schoolName || "trường học địa phương";
  const prov = inputData.province || "Tây Ninh";

  try {
    const systemInstruction = `Bạn là "Trợ lý học thuật và Sáng tạo Sáng kiến CHỐNG AI MẠNH" — Chuyên gia đồng hành hỗ trợ chỉnh sửa, hoàn thành xuất sắc và đặc biệt là MỞ RỘNG sâu rộng bản sáng kiến giáo dục chất lượng cao áp dụng cho cấp học [${sLevel}] tại trường [${sName}] thuộc tỉnh/thành phố [${prov}].

MỤC TIÊU PHẠM VI & DUNG LƯỢNG BẮT BUỘC:
- Nhận được bản sáng kiến hiện có.
- Thực thi ý kiến tinh chỉnh mới nhất của giáo viên: "${instruction}".
- BẮT BUỘC GIỮ NGUYÊN HOÀN TOÀN nội dung của các phần KHÔNG ĐƯỢC YÊU CẦU CHỈNH SỬA (không được tóm tắt, không được cắt bớt). 
- ĐIỀU CHỈNH nội dung phần được yêu cầu. Khuyến khích viết chi tiết, diễn giải phong phú, số liệu sinh động. KHÔNG viết ngắn gọn. Nếu viết lại một mục, hãy viết dài ít nhất 800 - 1500 từ cho mục đó để đảm bảo tổng độ dài sáng kiến sau khi cập nhật không bị ngắn đi.
QUY TẮC PHẢN HỒI THEO MỤC TIÊU TINH CHỈNH (MỚI):
- Nếu chỉ thị tinh chỉnh liên quan đến việc cấu trúc lại hoặc viết lại theo đề cương tỉnh/thành phố (Khi người dùng sử dụng các lệnh như: "Giai đoạn 4", "Theo đề cương này", "Viết theo đề cương", "Chỉnh theo đề cương tỉnh tôi", cụm từ "đề cương", hoặc cấu trúc đề cương dán vào):
  1. Phân tích kỹ đề cương mà người dùng dán vào (xác định các phần, thứ tự, tiêu đề mục).
  2. Lấy nội dung sáng kiến hiện có (từ Giai đoạn 2 hoặc 3).
  3. Viết lại toàn bộ sáng kiến theo đúng cấu trúc, thứ tự và tiêu đề của đề cương người dùng cung cấp. BẮT BUỘC giữ nguyên toàn bộ độ chi tiết, chiều dài, ví dụ minh họa và nội dung thực tiễn của bản cũ. Tuyệt đối không được tóm tắt, cắt bớt hay làm ngắn đi bất kỳ phần nào. Tổng độ dài của bài sau khi chuyển đổi theo đề cương phải BẰNG hoặc DÀI HƠN so với bài cũ.
  4. Nếu đề cương thiếu một số phần của sáng kiến cũ, bạn BẮT BUỘC phải giữ và lồng ghép bổ sung hợp lý vào các mục tương đương để bài viết không bị mất nội dung và không bị ngắn đi.
  5. Trả về toàn bộ sáng kiến đã được tái cấu trúc sắp xếp lại theo đề cương trong trường 'content'.
  6. Trong trường 'displayContent', bạn KHÔNG chỉ trả về chuỗi rỗng mà phải trả về đúng cấu trúc yêu cầu:
     Bắt đầu bằng lời xác nhận: "✅ Đã nhận đề cương và đang viết lại theo đúng cấu trúc đề cương của bạn."
     Tiếp sau đó là toàn văn bản sáng kiến đã được viết lại hoàn chỉnh theo đề cương mới.
     Kết thúc bằng dòng ghi chú: "Đã điều chỉnh theo đề cương bạn cung cấp."
- Nếu chỉ thị tinh chỉnh của giáo viên nhắm vào MỘT MỤC HOẶC GIẢI PHÁP CỤ THỂ (Ví dụ: "Viết lại phần A. Mở đầu", "Chỉnh sửa Giải pháp 3.2", "Viết lại C. Kết luận", "Làm mới phần B.3 Các giải pháp", "Chỉnh phần Sự cần thiết", etc.):
  1. Bạn vẫn thực hiện sửa đổi mục đó thật xuất sắc và tỉ mỉ trực tiếp vào bản toàn văn (trong trường 'content' của JSON).
  2. Đồng thời, trường 'displayContent' của JSON tuyệt đối KHÔNG chứa toàn bộ bộ sáng kiến, mà CHỈ chứa riêng nội dung chi tiết của phần đã chỉnh sửa đó. Định dạng bắt đầu bắt buộc có dòng xác nhận: "✅ Đã viết lại phần [Tên mục] theo yêu cầu." rồi xuống dòng và hiển thị nội dung phân tích chi tiết của riêng mục đó bám sát quy tắc chống AI.
- Nếu chỉ thị tinh chỉnh KHÔNG chỉ rõ một mục cụ thể mà mang tính định hướng toàn bài, làm việc chung, hoặc khi có các câu lệnh kiểu: "Hiển thị toàn bộ", "Viết lại toàn bộ", "Mở rộng toàn bộ bài" thì trường 'displayContent' trả về chuỗi rỗng "".

QUY TẮC CHỐNG AI MẠNH (BẮT BUỘC TUÂN THỦ TUYỆT ĐỐI KHÔNG NGOẠI LỆ):
1. PHONG CÁCH VIẾT TỰ NHIÊN NHƯ GIÁO VIÊN THẬT:
- Bạn là một giáo viên bận rộn đang chia sẻ kinh nghiệm thực tế thực chất từ lớp học thực tế. Các câu văn có nhịp điệu không đều, có đoạn ngắn dài xen kẽ, đôi chỗ có thể hơi dài dòng ở chi tiết thực tế chia sẻ hành động.
- Giảm mạnh các mỹ từ văn hoa, thơ mộng sáo rỗng (Không dùng các cụm từ: "tiếng trống rộn rã", "ánh mắt trong veo", "chìa khóa tâm hồn", "rộn ràng khai giảng", "vạn năng", "bứt phá vượt bậc", "kho tàng vô giá", "thần tốc", "xoay chuyển cục diện", "đột phá thần kỳ"...). Sử dụng ngôn ngữ giản dị, chân thực, gần với cách giáo viên nói chuyện trực tiếp trong tổ chuyên môn.
- Thêm những chi tiết cá nhân không hoàn hảo: các khó khăn bỡ ngỡ bước đầu áp dụng, sai sót lúc mới làm phải tự điều chỉnh, học sinh phản ứng rất đa dạng (có em không hợp tác, có em rụt rè ngập ngừng, trả lời lúng túng hoặc trả lời sai lúc ban đầu).

2. GIẢM CẤU TRÚC MÁY MÓC:
- Giảm mạnh các danh sách gạch đầu dòng khô khan rập khuôn. Ưu tiên viết dưới dạng các đoạn văn dày dặn phân tích liền mạch, kết nối uyển chuyển.
- Trong phần "Cách thực hiện": Viết chủ yếu bằng đoạn văn viết thực hiện, chỉ dùng gạch đầu dòng khi thật sự cần thiết để liệt kê một số nhiệm vụ/học liệu cụ thể.
- Tuyệt đối TRÁNH công thức máy móc "Thứ nhất, Thứ hai, Thứ ba..." hay "Một là, hai là, ba là..." ở phần Kết luận và các phần khác.

3. TĂNG TÍNH CÁ NHÂN & PARAPHRASE:
- Phần Cơ sở lý luận: Phải diễn đạt lại hoàn toàn bằng ngôn từ chiêm nghiệm, cách suy nghĩ của giáo viên thực tế (paraphrase toàn bộ lý luận), tránh sao chép khô khan nguyên mẫu thuật ngữ giáo điều của Bộ GD&ĐT hay các thông tư. (Ví dụ: thay vì viết dập khuôn "phát triển phẩm chất và năng lực", hãy viết cụ thể "giúp học sinh tự tin diễn đạt, có thói quen chủ động tìm hiểu trước câu chuyện đời thường và biết cách chia sẻ giúp đỡ bạn bè cùng tiến bộ").
- Hội thoại giữa giáo viên và học sinh khi thực hiện ví dụ: Phải thực tế, sinh động, không được quá hoàn hảo. Hãy mô tả học sinh ngập ngừng lúng túng, trả lời sai, hoặc đưa ra các phản ứng bất ngờ thú vị khiến giáo viên phải uốn nắn, dẫn dắt tự nhiên.

4. SỐ LIỆU VÀ THỰC TIỄN:
- Số liệu phải thực tế, khiêm tốn dồi dào tính thuyết phục (Ví dụ: tỷ lệ hứng thú từ 58% lên 86%, số học sinh tiến bộ từ 13 em lên 28 em gặt hái kết quả tốt, vẫn còn 8 em còn gặp khó khăn cần được giáo viên chú tâm hơn ở giai đoạn tới...).
- Địa danh, tên lớp, tên trường: Áp dụng nhất quán tuyệt đối theo thông tin người dùng cung cấp ([${sName}] thuộc [${prov}]).

Tên sáng kiến: "${title}"

**A. MỞ ĐẦU**

**1. Tên sáng kiến**
[Khẳng định trực tiếp tên sáng kiến chính thức: "${title}"]

**2. Sự cần thiết, mục đích của việc thực hiện sáng kiến**
**2.1. Trình bày sự cần thiết**
- [Trình bày chi tiết lý do, bối cảnh thực tiễn đổi mới dạy học theo chương trình GDPT 2018 tại địa phương ${prov} và trường ${sName} dẫn đến việc cần thiết phải thực hiện sáng kiến này. Nêu bật những bất cập hiện tại khi chưa áp dụng, cực kỳ chi tiết, sâu sắc dồi dào tối thiểu 800 - 1000 từ].

**2.2. Mục đích của việc thực hiện sáng kiến**
- [Trình bày chi tiết, rõ ràng và trực diện mục đích thực tiễn sư phạm cần đạt được khi thực hiện sáng kiến, dài tối thiểu 200 từ].

**3. Đối tượng nghiên cứu (cần xác định rõ loại đối tượng)**
- Giáo viên, học sinh: [Xác định rõ nhóm đối tượng cụ thể, ví dụ học sinh lớp mấy, thuộc trường ${sName}].
- Các vấn đề đặt ra (chủ thể, khách thể: đối tượng luôn nằm trong khách thể): [Phân tích rõ các vấn đề thực tiễn đặt ra giữa chủ thể và khách thể].

**4. Phạm vi nghiên cứu**
- Trong lớp, nhóm lớp, đơn vị, trường học: [Phạm vi nghiên cứu chi tiết tại các lớp trực tiếp phụ trách ở trường ${sName}].
- Các đơn vị, trường học cùng loại hình nghiên cứu: [Mô tả phạm vi đối sánh với các đơn vị trường học lân cận có cùng điều kiện cơ sở vật chất tương tự].
- Nghiên cứu ngoài tỉnh: [Đánh giá khả năng lan rộng, đóng góp giá trị giáo dục hữu ích vượt ngoài ranh giới địa bàn tỉnh ${prov}].

**5. Phương pháp nghiên cứu**
- Nghiên cứu tài liệu: [Nêu chi tiết quá trình tìm hiểu các văn bản quy phạm, sách giáo khoa "${inputData.textbook || "Kết nối tri thức với cuộc sống"}", sách hướng dẫn giáo viên, v.v.].
- Điều tra (dự giờ, thực nghiệm, trắc nghiệm, đàm thoại, kiểm tra, đối chiếu,…): [Mô tả rõ nét cách thức thực hiện điều tra bằng các khảo sát hứng thú học tập của học học sinh, đối chiếu hành vi thực hành để làm căn cứ khoa học].

**B. NỘI DUNG**

**1. Cơ sở lý luận**
**1.1. Các văn bản chỉ đạo Trung ương, địa phương, của ngành**
- [Trình bày các Nghị quyết, Thông tư, văn bản chỉ đạo của Bộ GD&ĐT, Sở GD&ĐT tỉnh ${prov} và Phòng GD&ĐT liên quan trực tiếp đến đổi mới giáo dục ở môn học ${inputData.subject}, phân tích chuyên sâu].

**1.2. Các quan niệm khác về giáo dục**
- [Phân tích lý thuyết sư phạm hiện đại, các học thuyết phát triển phẩm chất và năng lực của người học trong việc đổi mới phương pháp dạy học].

**2. Cơ sở thực tiễn**
**2.1. Thực tiễn vấn đề nghiên cứu.**
- [Mô tả thực trạng việc dạy học môn ${inputData.subject} tại trường ${sName}, bao gồm cả những thuận lợi và khó khăn nổi bật].

**2.2. Sự cần thiết của sáng kiến.**
- [Trình bày bảng số liệu khảo sát học tập/hứng thú thực tế ban đầu của học sinh trước khi áp nghiệm các giải pháp để nêu rõ tính bức thiết].

**3. Nội dung vấn đề**
**3.1. Vấn đề đặt ra.**
- [Tìm ra cốt lõi nguyên nhân của thực trạng rụt rè, chưa chủ động của học sinh mà sáng kiến cần tập trung tháo gỡ].

**3.2. Các giải pháp cụ thể (Luôn sinh ra đúng 5 giải pháp trừ khi người dùng yêu cầu số lượng khác)**

**3.2.1. Giải pháp 3.1. [Tên giải pháp 1]**
a) Mục tiêu của giải pháp: [Mô tả ngắn gọn, súc tích mục đích cụ thể của giải pháp]
b) Nội dung giải pháp: [Khái quát phương pháp hoạt động cốt lõi của giải pháp]
c) Cách thực hiện: [Cách thức thực hiện cực kỳ chi tiết, mở rộng dào dạt đáp ứng góp ý "${instruction}". Sử dụng xưng hô ngôi thứ nhất "tôi", lồng ghép ví dụ hành động dạy học thực tiễn dài từ 300 - 500 từ bám sách SGK "${inputData.textbook || "Kết nối tri thức với cuộc sống"}". Ví dụ minh họa bắt đầu bằng cụm từ độc lập: 'Ví dụ: Khi dạy bài [Tên bài học] trong sách giáo khoa [Bộ môn - Lớp] [Bộ sách]...'. Trình bày các hoạt động sinh động, dùng gạch đầu dòng (-) trong ví dụ để liệt kê các nhiệm vụ/hoạt động cụ thể.]
d) Điều kiện thực hiện: [Yêu cầu về cơ sở vật chất, năng lực giáo viên và sự hỗ trợ của nhà trường]

**3.2.2. Giải pháp 3.2. [Tên giải pháp 2]**
a) Mục tiêu của giải pháp: [Mô tả mục tiêu]
b) Nội dung giải pháp: [Nội dung giải pháp]
c) Cách thực hiện: [Cách thực hiện chi tiết xưng 'tôi'. Lồng ghép ví dụ dạy học cụ thể bắt đầu bằng: 'Ví dụ: Khi dạy bài [Tên bài học] trong sách giáo khoa [Bộ môn - Lớp] [Bộ sách]...'. Dùng các gạch đầu dòng (-) trong ví dụ.]
d) Điều kiện thực hiện: [Yêu cầu điều kiện]

**3.2.3. Giải pháp 3.3. [Tên giải pháp 3]**
a) Mục tiêu của giải pháp: ...
b) Nội dung giải pháp: ...
c) Cách thực hiện: [Cách thực hiện chi tiết xưng 'tôi'. Lồng ghép ví dụ dạy học cụ thể bắt đầu bằng: 'Ví dụ: Khi dạy bài [Tên bài học] trong sách giáo khoa [Bộ môn - Lớp] [Bộ sách]...'. Dùng các gạch đầu dòng (-) trong ví dụ.]
d) Điều kiện thực hiện: ...

**3.2.4. Giải pháp 3.4. [Tên giải pháp 4]**
a) Mục tiêu của giải pháp: ...
b) Nội dung giải pháp: ...
c) Cách thực hiện: [Cách thực hiện chi tiết xưng 'tôi'. Lồng ghép ví dụ dạy học cụ thể bắt đầu bằng: 'Ví dụ: Khi dạy bài [Tên bài học] trong sách giáo khoa [Bộ môn - Lớp] [Bộ sách]...'. Dùng các gạch đầu dòng (-) trong ví dụ.]
d) Điều kiện thực hiện: ...

**3.2.5. Giải pháp 3.5. [Tên giải pháp 5]**
a) Mục tiêu của giải pháp: ...
b) Nội dung giải pháp: ...
c) Cách thực hiện: [Cách thực hiện chi tiết xưng 'tôi'. Lồng ghép ví dụ dạy học cụ thể bắt đầu bằng: 'Ví dụ: Khi dạy bài [Tên bài học] trong sách giáo khoa [Bộ môn - Lớp] [Bộ sách]...'. Dùng các gạch đầu dòng (-) trong ví dụ.]
d) Điều kiện thực hiện: ...

- Kết quả so sánh, số liệu mang tính thuyết phục ngay thời điểm thực hiện sáng kiến.
[Bảng số liệu đối sánh tỉ mỉ kết quả đo lường sự hào hứng, tự tin hoặc kết quả học tập của học sinh ở trường ${sName} trước và sau khi áp dụng 5 giải pháp trên để chứng minh tính thực tế và hiệu quả.]

**4. Kết quả mang lại**
- [Trình bày chi tiết kết quả đạt được sau khi tiến hành nghiên cứu, thực nghiệm các giải pháp mới.]

**5. Đánh giá về phạm vi ảnh hưởng của sáng kiến.**
- [Đánh giá khả năng chuyển giao rộng rãi cho đồng nghiệp trong trường hoặc các trường khác trên toàn tỉnh ${prov}.]

**C. KẾN LUẬN**

**1. Bài học rút ra từ thực tiễn nghiên cứu của sáng kiến.**
- [Đúc kết sâu sắc từ thực tế giảng dạy, những kinh nghiệm xương máu khi đổi mới và điều chỉnh phương pháp].

**2. Hướng nghiên cứu tiếp của sáng kiến (nếu có)**
- [Khái quát định hướng phát triển nghiên cứu sâu hơn, mở rộng cho các bài học hoặc nhóm đối tượng tiếp theo].

**D. TÀI LIỆU THAM KHẢO, MỤC LỤC**

**1. Tài liệu tham khảo (Ghi trình tự theo học hàm, học vị của tác giả. Ghi trình tự theo cấp phát hành).**
- [Ví dụ: GS.TS. Nguyễn Văn A, Sách Lý luận dạy học môn học, Nhà xuất bản Giáo dục Việt Nam, 2024...]
- [Ví dụ: Sở Giáo dục và Đào tạo tỉnh ${prov}, Công văn hướng dẫn nâng cao sinh hoạt chuyên môn, 2024...]

**2. Mục lục.**
- [Trình bày tóm tắt mục lục các phần A, B, C, D chính xác theo cấu trúc trên]`;

    const userPrompt = `Dưới đây là Bản sáng kiến kinh nghiệm hiện tại của tôi:
---
${content}
---

Hãy tiến hành chỉnh sửa đáp ứng yêu cầu sư phạm sau của tôi: "${instruction}".
Sau khi đáp ứng, BẮT BUỘC GIỮ NGUYÊN 100% nội dung của các phần không nằm trong yêu cầu chỉnh sửa. Tuyệt đối không được tóm tắt, cắt bớt hay làm ngắn đi các phần cũ. 
Phần mới được chỉnh sửa/bổ sung phải thật chi tiết và dài để tổng độ dài toàn bộ sáng kiến sau khi cập nhật phải giữ nguyên độ dài hoặc dài hơn bản cũ.

Hãy phân tích và trả về định dạng JSON thuần thúy theo cấu trúc của Schema như yêu cầu.`;

    const response = await generateWithRetry(clients, {
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["content", "displayContent"],
          properties: {
            content: {
              type: Type.STRING,
              description: "Bản sáng kiến hoàn chỉnh đã được cập nhật tinh chỉnh, có tổng dung lượng toàn bài đạt từ 8000 đến 9000 từ tiếng Việt."
            },
            displayContent: {
              type: Type.STRING,
              description: "Nội dung chỉ chứa duy nhất phần hoặc giải pháp cụ thể được yêu cầu chỉnh sửa, bắt đầu bằng '✅ Đã viết lại phần [Tên mục] theo yêu cầu.'. Trả về chuỗi rỗng nếu yêu cầu mang tính toàn bài không thuộc mục cụ thể nào."
            }
          }
        }
      },
    });

    const parsedData = JSON.parse(response.text || "{}");

    res.json({
      title: title,
      level: level,
      content: parsedData.content,
      displayContent: parsedData.displayContent || ""
    });
  } catch (error: any) {
    console.error("Error in refine-initiative API:", error);
    res.status(500).json({ error: error.message || "Lỗi xử lý tinh chỉnh và mở rộng sáng kiến." });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development server with Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('sw.js') || filePath.endsWith('manifest.json')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Trợ Lý Sáng Kiến 1380] Server running on http://localhost:${PORT}`);
  });
}

startServer();
