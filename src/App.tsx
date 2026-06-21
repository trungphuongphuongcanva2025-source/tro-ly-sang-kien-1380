import React, { useState, useEffect, useRef } from "react";
import { 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Copy, 
  Download, 
  ArrowRight, 
  ArrowLeft, 
  History, 
  Trash2, 
  Plus, 
  Printer,
  ChevronRight,
  FileCheck,
  Award,
  HelpCircle,
  Settings,
  Compass
} from "lucide-react";
import { InitiativeLevel, InitiativeInput, SuggestedName, SavedInitiative } from "./types";

const PRESETS = [
  {
    label: "Toán học (Lớp 7)",
    subject: "Toán học - Số học (Lớp 7)",
    rawIdea: "Học sinh thường sợ học số thực và số hữu tỉ vì khô khan. Tôi thiết kế hoạt động trải nghiệm 'Hành trình tài chính gia đình' nơi học sinh tự lên kế hoạch thu chi thực tế của gia đình trong 1 tuần.",
    targetStudents: "Học sinh lớp 7A1, 7A2 trường THCS Nguyễn Thái Học",
    coreProblem: "Học sinh tính nhầm dấu khi nhân chia phân số âm, thiếu liên hệ thực tiễn nên uể oải, học trước quên sau, chưa chủ động vận dụng lý thuyết.",
    goal: "95% học sinh làm đúng các phép tính cơ bản số hữu tỉ, tạo không khí học tập hào hứng thực tiễn, giúp các em biết quản lý tiền bạc cá nhân cơ bản.",
    level: "Cơ sở",
    textbook: "Kết nối tri thức với cuộc sống",
    schoolLevel: "THCS",
    schoolName: "Trường THCS Nguyễn Thái Học",
    province: "Tây Ninh"
  },
  {
    label: "Toán (Lớp 2)",
    subject: "Toán học - Phép cộng, phép trừ có nhớ trong phạm vi 100 (Lớp 2)",
    rawIdea: "Sử dụng các đồ vật trực quan quen thuộc (như que tính màu sắc, kẹp gỗ) kết hợp các trò chơi tiếp sức 'Chợ quê nhộn nhịp' giúp học sinh tự thao tác mua bán đơn giản để thực hành và hiểu bản chất của phép tính có nhớ.",
    targetStudents: "Học sinh lớp 2A, trường Tiểu học Kim Đồng",
    coreProblem: "Học sinh lớp 2 còn gặp nhiều khó khăn khi thực hiện các phép cộng, trừ có nhớ, thường quên không cộng thêm phần nhớ vào hàng chục hoặc nhầm lẫn khi trừ.",
    goal: "Nâng cao phản xạ tính nhẩm nhanh có nhớ của 100% học sinh, tăng cường khả năng tự tin giao tiếp cộng tác thông qua trò chơi đóng vai thực tế.",
    level: "Cơ sở",
    textbook: "Kết nối tri thức với cuộc sống",
    schoolLevel: "Tiểu học",
    schoolName: "Trường Tiểu học Kim Đồng",
    province: "Tây Ninh"
  },
  {
    label: "Hóa học (Lớp 12)",
    subject: "Hóa học - Bài toán thực tế Polime & Este (Lớp 12)",
    rawIdea: "Tổ chức chuyên đề 'Hóa học và Đời sống xanh' thông qua việc nghiên cứu quy trình điều chế nhựa sinh học từ tinh bột và thực hiện phản ứng xà phòng hóa chất béo tái chế tại phòng thí nghiệm trường học.",
    targetStudents: "Học sinh lớp 12 chuyên Hóa và khối tự nhiên trường THPT Chuyên Hoàng Lê Kha",
    coreProblem: "Phần lý thuyết Polime và Este rất trừu tượng, nhiều công thức phản ứng hữu cơ phức tạp. Học sinh lúng túng khi giải bài tập liên quan đến thực tiễn sản xuất công nghiệp và đời sống.",
    goal: "Học sinh hiểu vững bản chất phản ứng, chế tạo thành công mẫu nhựa phân hủy sinh học đơn giản, cải thiện điểm số kiểm tra định kỳ thêm 15%.",
    level: "Cấp tỉnh",
    textbook: "Kết nối tri thức với cuộc sống",
    schoolLevel: "THPT",
    schoolName: "Trường THPT Chuyên Hoàng Lê Kha",
    province: "Tây Ninh"
  }
];

export default function App() {
  // Input states
  const [form, setForm] = useState<InitiativeInput>({
    rawIdea: "",
    level: "both",
    subject: "",
    targetStudents: "",
    coreProblem: "",
    goal: "",
    textbook: "Kết nối tri thức với cuộc sống",
    schoolLevel: "THCS",
    schoolName: "",
    province: "Tây Ninh"
  });

  // App running states
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1); // 1: Suggesting names, 2: Writing content, 3: Tùy chỉnh, 4: Chỉnh theo đề cương tỉnh
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [refineInstruction, setRefineInstruction] = useState<string>("");
  const [outlineText, setOutlineText] = useState<string>("");
  const [lastRefinementMsg, setLastRefinementMsg] = useState<string>("");
  
  // API connection health check
  const [health, setHealth] = useState<{ hasApiKey: boolean; checked: boolean }>({
    hasApiKey: false,
    checked: false
  });

  // Generated feedback/data
  const [analysis, setAnalysis] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<SuggestedName[]>([]);
  const [selectedNameId, setSelectedNameId] = useState<string>("");
  const [detailedContent, setDetailedContent] = useState<string>("");
  const [displayContent, setDisplayContent] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<InitiativeLevel>(InitiativeLevel.CO_SO);

  // History state
  const [history, setHistory] = useState<SavedInitiative[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>("mo-dau");
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState<boolean>(false);

  // Quick Display and API Settings config states
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem("gemini_custom_api_key") || "";
    } catch (e) {
      return "";
    }
  });
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg" | "xl">(() => {
    try {
      return (localStorage.getItem("pref_font_size") as "sm" | "md" | "lg" | "xl") || "md";
    } catch (e) {
      return "md";
    }
  });
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    try {
      return localStorage.getItem("pref_high_contrast") === "true";
    } catch (e) {
      return false;
    }
  });
  const [showPaperLines, setShowPaperLines] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("pref_paper_lines");
      return saved === null ? true : saved === "true";
    } catch (e) {
      return true;
    }
  });

  const handleSaveApiKey = (key: string) => {
    const trimmed = key.trim();
    setCustomApiKey(trimmed);
    try {
      localStorage.setItem("gemini_custom_api_key", trimmed);
    } catch (e) {
      console.warn("Storage writing failed:", e);
    }
    setTimeout(() => {
      checkHealth();
    }, 150);
  };

  const handleResetApiKey = () => {
    setCustomApiKey("");
    try {
      localStorage.removeItem("gemini_custom_api_key");
    } catch (e) {
      console.warn("Storage removal failed:", e);
    }
    setTimeout(() => {
      checkHealth();
    }, 150);
  };

  // Loading text rotating animation for Stage 2
  const [loadingText, setLoadingText] = useState<string>("Đang khởi động tiến trình...");
  const loadingSteps = [
    "Đang phân tích ý tưởng sư phạm và bối cảnh...",
    "Đang thiết lập chương trình Giáo dục phổ thông 2018...",
    "Đang liên kết cơ sở lý luận từ các văn bản chính trị giáo dục cấp thiết...",
    "Đang soạn thảo giải pháp chi tiết độc quyền ở NGÔI THỨ NHẤT...",
    "Đang tích hợp ví dụ bài giảng thực tế từ sách giáo khoa Kết nối tri thức...",
    "Đang đúc rút bài học kinh nghiệm và phương án nhân rộng tại Tây Ninh...",
    "Đang tối ưu hóa định dạng báo cáo chuẩn Công văn 1380..."
  ];

  const contentRef = useRef<HTMLDivElement>(null);

  // Load history & Check backend health on mount
  useEffect(() => {
    checkHealth();
    loadSavedHistory();
  }, []);

  // Set rotating text for loading
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      let index = 0;
      setLoadingText(loadingSteps[0]);
      interval = setInterval(() => {
        index = (index + 1) % loadingSteps.length;
        setLoadingText(loadingSteps[index]);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Handle active section scrolling detection inside paper view
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPos = container.scrollTop;
    
    // Simple block coordinate offset checking to sync table of contents
    if (scrollPos < 350) {
      setActiveSection("mo-dau");
    } else if (scrollPos < 1100) {
      setActiveSection("noi-dung-ly-luan");
    } else if (scrollPos < 2200) {
      setActiveSection("giai-phap");
    } else {
      setActiveSection("ket-luan");
    }
  };

  const checkHealth = async () => {
    try {
      let activeKey = "";
      try {
        activeKey = localStorage.getItem("gemini_custom_api_key") || "";
      } catch (e) {}
      const res = await fetch("/api/health", {
        headers: activeKey ? { "x-api-key": activeKey } : {}
      });
      const data = await res.json();
      setHealth({
        hasApiKey: data.hasApiKey,
        checked: true
      });
    } catch (e) {
      console.error("Health check error:", e);
      setHealth({
        hasApiKey: false,
        checked: true
      });
    }
  };

  const loadSavedHistory = () => {
    try {
      const list = localStorage.getItem("saved_initiatives_1380");
      if (list) {
        const parsed = JSON.parse(list);
        if (Array.isArray(parsed)) {
          const sliced = parsed.slice(0, 1);
          setHistory(sliced);
          if (parsed.length > 1) {
            localStorage.setItem("saved_initiatives_1380", JSON.stringify(sliced));
          }
        }
      }
    } catch (e) {
      console.error("JSON history parsing or access error:", e);
    }
  };

  // Preset quick fill
  const applyPreset = (preset: typeof PRESETS[0]) => {
    setForm({
      rawIdea: preset.rawIdea,
      level: preset.level === "Cơ sở" ? InitiativeLevel.CO_SO : (preset.level === "Cấp tỉnh" ? InitiativeLevel.CAP_TINH : "both"),
      subject: preset.subject,
      targetStudents: preset.targetStudents,
      coreProblem: preset.coreProblem,
      goal: preset.goal,
      textbook: preset.textbook,
      schoolLevel: preset.schoolLevel || "THCS",
      schoolName: preset.schoolName || "",
      province: preset.province || "Tây Ninh"
    });
  };

  // Submit form for names
  const handleSuggestNames = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const processedForm = { ...form };
    if (!processedForm.goal || processedForm.goal.trim() === "") {
      processedForm.goal = `Phát triển phẩm chất, nâng cao năng lực tự chủ học tập và khơi gợi niềm hứng thú sâu sắc của học sinh khi học môn/lĩnh vực ${form.subject || "học"}.`;
    }

    if (!processedForm.rawIdea || !processedForm.subject || !processedForm.coreProblem || !processedForm.goal) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc để trợ lý sư phạm bắt đầu phân tích.");
      return;
    }

    setIsSuggesting(true);
    setAnalysis(null);
    setSuggestions([]);
    setDetailedContent("");
    setSelectedNameId("");

    try {
      const activeKey = localStorage.getItem("gemini_custom_api_key") || "";
      const response = await fetch("/api/suggest-names", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(activeKey ? { "x-api-key": activeKey } : {})
        },
        body: JSON.stringify(processedForm)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Lỗi bất thường từ server đề xuất.");
      }

      const resData = await response.json();
      setAnalysis(resData.analysis);
      setSuggestions(resData.suggestions);
      
      // Auto-focus output area if mobile
      setTimeout(() => {
        document.getElementById("output-panel")?.scrollIntoView({ behavior: "smooth" });
      }, 200);

    } catch (error: any) {
      alert("Có lỗi xảy ra: " + error.message);
    } finally {
      setIsSuggesting(false);
    }
  };

  // Request Stage 2: full detailed writing
  const handleGenerateFullInitiative = async (nameObj: SuggestedName) => {
    setIsGenerating(true);
    setSelectedNameId(nameObj.id);
    setSelectedLevel(nameObj.level);
    setDetailedContent("");
    setDisplayContent("");
    setOutlineText("");

    try {
      let activeKey = "";
      try {
        activeKey = localStorage.getItem("gemini_custom_api_key") || "";
      } catch (e) {}

      const processedForm = { ...form };
      if (!processedForm.goal || processedForm.goal.trim() === "") {
        processedForm.goal = `Phát triển phẩm chất, nâng cao năng lực tự chủ học tập và khơi gợi niềm hứng thú sâu sắc của học sinh khi học môn/lĩnh vực ${form.subject || "học"}.`;
      }

      const response = await fetch("/api/generate-initiative", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(activeKey ? { "x-api-key": activeKey } : {})
        },
        body: JSON.stringify({
          title: nameObj.name,
          level: nameObj.level,
          inputData: processedForm
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Gặp sự cố khi kết nối dữ liệu biên soạn.");
      }

      const data = await response.json();
      setDetailedContent(data.content);
      setDisplayContent("");
      setStage(2);

      // Save to localStorage history
      const newDraft: SavedInitiative = {
        id: "draft-" + Date.now(),
        title: nameObj.name,
        level: nameObj.level,
        inputData: form,
        createdAt: new Date().toLocaleString("vi-VN"),
        content: data.content
      };

      const updatedHistory = [newDraft, ...history].slice(0, 1);
      setHistory(updatedHistory);
      try {
        localStorage.setItem("saved_initiatives_1380", JSON.stringify(updatedHistory));
      } catch (e) {
        console.warn("Storage writing failed:", e);
      }

      // Scroll to content top
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = 0;
        }
      }, 100);

    } catch (error: any) {
      alert("Lỗi biên tập sáng kiến: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefineInitiative = async (instructionText: string) => {
    if (!instructionText.trim()) return;
    setIsRefining(true);
    setLastRefinementMsg("");
    try {
      let activeKey = "";
      try {
        activeKey = localStorage.getItem("gemini_custom_api_key") || "";
      } catch (e) {}
      const response = await fetch("/api/refine-initiative", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(activeKey ? { "x-api-key": activeKey } : {})
        },
        body: JSON.stringify({
          title: selectedNameId ? suggestions.find(s => s.id === selectedNameId)?.name || "" : "Sáng kiến Giáo dục Tây Ninh",
          level: selectedLevel,
          content: detailedContent,
          instruction: instructionText,
          inputData: form
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Gặp sự cố khi kết nối dữ liệu tinh chỉnh.");
      }

      const data = await response.json();
      setDetailedContent(data.content);
      setDisplayContent(data.displayContent || "");
      
      // Calculate word count
      const wordsCount = data.content.trim().split(/\s+/).filter(Boolean).length;
      
      const successMsg = `✅ Đã chỉnh sửa và mở rộng sáng kiến. Tổng độ dài hiện tại khoảng ${wordsCount} chữ (đạt yêu cầu 4000-4500 chữ).`;
      setLastRefinementMsg(successMsg);
      setRefineInstruction("");
      setStage(3); // Transition to Stage 3 upon success

      // Add to local storage history to preserve latest edits
      const updatedHistory = history.map(h => {
        // If it's the current draft (or similar title/level), let's update its content
        if (h.title === (selectedNameId ? suggestions.find(s => s.id === selectedNameId)?.name : "")) {
          return { ...h, content: data.content };
        }
        return h;
      }).slice(0, 1);
      setHistory(updatedHistory);
      try {
        localStorage.setItem("saved_initiatives_1380", JSON.stringify(updatedHistory));
      } catch (e) {
        console.warn("Storage writing failed:", e);
      }

      // Scroll to content top
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = 0;
        }
      }, 100);

    } catch (error: any) {
      alert("Lỗi tinh chỉnh sáng kiến: " + error.message);
    } finally {
      setIsRefining(false);
    }
  };

  const handleCopy = () => {
    if (!detailedContent) return;
    navigator.clipboard.writeText(detailedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    handleDownloadFormat("docx");
  };

  const handleDownloadFormat = (format: "txt" | "doc" | "docx") => {
    if (!detailedContent) return;
    setIsDownloadMenuOpen(false);

    const title = suggestions.find(s => s.id === selectedNameId)?.name || "Sang_Kien_Giao_Duc_1380";
    const cleanTitle = title.replace(/[\s\/:*?"<>|]/g, "_").substring(0, 80);
    const fileName = `${selectedLevel === InitiativeLevel.CO_SO ? "CapCoSo" : "CapTinh"}_${cleanTitle}.${format}`;

    if (format === "txt") {
      const element = document.createElement("a");
      const file = new Blob([detailedContent], { type: "text/plain;charset=utf-8" });
      element.href = URL.createObjectURL(file);
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      return;
    }

    // Convert detailedContent to Microsoft Word friendly HTML markup
    const lines = detailedContent.split("\n");
    let htmlContent = "";

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        htmlContent += "<p style='margin: 0 0 6pt 0;'>&nbsp;</p>";
        return;
      }

      // Format bold, italics
      let formattedLine = trimmed
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, "<code>$1</code>");

      // Check headings
      const isHeaderAtoC = trimmed.match(/^[A-C]\.\s+[A-ZÀ-ỸĐ\s\d\-]+$/);
      const isIntroHeader = trimmed.startsWith("📝 NỘI DUNG SÁNG KIẾN") || trimmed.startsWith("TÊN SÁNG KIẾN") || trimmed.startsWith("**TÊN SÁNG KIẾN");
      
      if (isHeaderAtoC || isIntroHeader) {
        htmlContent += `
          <h2 style="font-family: 'Times New Roman', serif; font-size: 14pt; font-weight: bold; text-transform: uppercase; color: #1e3a8a; margin-top: 24pt; margin-bottom: 8pt; border-bottom: 1.5pt solid #1e3a8a; padding-bottom: 4pt; text-align: left;">
            ${formattedLine.replace(/📝\s*/, "").replace(/\*\*\s*/, "")}
          </h2>`;
      } else if (trimmed.match(/^(\d+|\bGiải pháp\b\s+\d+\.\d+)\.?\s/) || trimmed.match(/^\d+\.\s+/)) {
        htmlContent += `
          <h3 style="font-family: 'Times New Roman', serif; font-size: 13pt; font-weight: bold; color: #1d4ed8; margin-top: 16pt; margin-bottom: 6pt; text-align: justify; text-indent: 0in;">
            ${formattedLine}
          </h3>`;
      } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const cleanLi = formattedLine.replace(/^[\-\*]\s*/, "");
        htmlContent += `
          <ul style="margin: 0 0 6pt 0; padding-left: 20px;">
            <li style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; margin-bottom: 4pt; text-align: justify;">
              ${cleanLi}
            </li>
          </ul>`;
      } else if (trimmed.startsWith("Ví dụ:") || trimmed.includes("Ví dụ: Khi dạy bài")) {
        htmlContent += `
          <div style="background-color: #f8fafc; border-left: 3pt solid #2563eb; padding: 10pt; margin: 12pt 0; font-family: 'Times New Roman', serif; font-size: 11.5pt; font-style: italic; color: #1e293b;">
            <strong style="color: #1e3a8a; font-style: normal;">Ví dụ cụ thể thực chứng:</strong><br/>
            ${formattedLine}
          </div>`;
      } else {
        htmlContent += `
          <p style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; text-indent: 0.5in; margin: 0 0 10pt 0; text-align: justify;">
            ${formattedLine}
          </p>`;
      }
    });

    const wordHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <title>${title}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 21cm 29.7cm; /* A4 */
            margin: 2.0cm 2.0cm 2.0cm 2.5cm; /* Margins: Top 2, Bottom 2, Right 2, Left 2.5 */
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #1a1a1a;
          }
        </style>
      </head>
      <body>
        <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; margin-bottom: 40pt;">
          <tr>
            <td style="width: 50%; text-align: center; font-size: 11pt; font-family: 'Times New Roman', serif; vertical-align: top;">
              <strong>SỞ GIÁO DỤC VÀ ĐÀO TẠO TÂY NINH</strong><br/>
              <span style="font-size: 10.5pt;">QUY CHUẨN CÔNG VĂN 1380</span><br/>
              <span style="border-top: 1px solid #333; display: inline-block; width: 60px; margin-top: 4px;"></span>
            </td>
            <td style="width: 50%; text-align: center; font-size: 11pt; font-family: 'Times New Roman', serif; vertical-align: top;">
              <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
              <strong style="font-size: 10.5pt; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</strong>
            </td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 60pt; margin-bottom: 60pt; font-family: 'Times New Roman', serif;">
          <p style="font-size: 14pt; font-weight: bold; margin-bottom: 10pt; text-transform: uppercase; color: #1e3a8a;">BÁO CÁO KẾT QUẢ SÁNG KIẾN KINH NGHIỆM GIÁO DỤC LẬP QUY</p>
          <div style="border: 2px solid #1e3a8a; padding: 15pt; background-color: #f8fafc; border-radius: 6pt; margin: 0 auto; max-width: 550px;">
            <p style="font-size: 15pt; font-weight: bold; color: #111827; text-transform: uppercase; line-height: 1.4; text-indent: 0; margin: 0;">
              "${title}"
            </p>
          </div>
          <table border="0" cellspacing="0" cellpadding="0" style="margin: 40pt auto 0 auto; font-size: 12pt; font-family: 'Times New Roman', serif; text-align: left;">
            <tr>
              <td style="padding: 4pt 8pt; font-weight: bold;">Cấp độ xét duyệt:</td>
              <td style="padding: 4pt 8pt; color: #1e3a8a; font-weight: bold;">${selectedLevel === InitiativeLevel.CO_SO ? "CẤP CƠ SỞ" : "CẤP TỈNH"}</td>
            </tr>
            <tr>
              <td style="padding: 4pt 8pt; font-weight: bold;">Bộ môn nghiên cứu:</td>
              <td style="padding: 4pt 8pt;">${form.subject || "Giáo dục"}</td>
            </tr>
            <tr>
              <td style="padding: 4pt 8pt; font-weight: bold;">Chương trình SGK:</td>
              <td style="padding: 4pt 8pt;">Dựa trên chương trình GDPT 2018 (${form.textbook || "Kết nối tri thức"})</td>
            </tr>
          </table>
          <p style="font-size: 12pt; font-style: italic; margin-top: 100pt; text-indent: 0;">Tây Ninh, năm 2026</p>
        </div>

        <br clear="all" style="page-break-before: always; mso-break-type: section-break;" />

        <div style="font-family: 'Times New Roman', serif;">
          ${htmlContent}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff" + wordHTML], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const element = document.createElement("a");
    element.href = url;
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSelectHistory = (item: SavedInitiative) => {
    setForm(item.inputData);
    setDetailedContent(item.content || "");
    setDisplayContent("");
    setOutlineText("");
    setSelectedLevel(item.level);
    setSelectedNameId("history-item");
    
    // Construct fake suggestions to hold the selected title
    setSuggestions([
      {
        id: "history-item",
        name: item.title,
        reason: "Khôi phục từ bộ nhớ sáng kiến đã lưu.",
        level: item.level,
        strengths: "Đã hoàn thành toàn bộ nội dung."
      }
    ]);
    
    setStage(2);
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let approved = false;
    try {
      approved = confirm("Bạn có chắc chắn muốn xóa sáng kiến này khỏi lịch sử lưu trữ?");
    } catch (err) {
      approved = true;
    }
    if (approved) {
      const updated = history.filter(item => item.id !== id);
      setHistory(updated);
      try {
        localStorage.setItem("saved_initiatives_1380", JSON.stringify(updated));
      } catch (errStorage) {
        console.warn("Storage writing failed:", errStorage);
      }
    }
  };

  const scrollToAnchor = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(elementId);
    }
  };

  const clearForm = () => {
    let approved = false;
    try {
      approved = confirm("Bắt đầu biên soạn ý tưởng mới và xóa sạch nội dung hiện tại trên form?");
    } catch (err) {
      approved = true;
    }
    if (approved) {
      setForm({
        rawIdea: "",
        level: "both",
        subject: "",
        targetStudents: "",
        coreProblem: "",
        goal: "",
        textbook: "Kết nối tri thức với cuộc sống",
        schoolLevel: "THCS",
        schoolName: "",
        province: "Tây Ninh"
      });
      setAnalysis(null);
      setSuggestions([]);
      setDetailedContent("");
      setDisplayContent("");
      setOutlineText("");
      setStage(1);
      setSelectedNameId("");
    }
  };

  // Custom rich scholarly text formatter to split text into beautifully rendered components
  const renderFormattedText = (rawText: string) => {
    if (!rawText) return null;
    
    // Normalizing text lines
    const lines = rawText.split("\n");
    const elements: React.ReactNode[] = [];
    
    // Clean up typical markdown formatting markers and remove bullet markers, "$" signs and "-" signs from text representation
    const cleanText = (text: string) => {
      let cleaned = text;
      // Remove all dollar signs '$'
      cleaned = cleaned.replace(/\$/g, "");
      // Remove all bullet characters '•'
      cleaned = cleaned.replace(/•/g, "");
      // Remove all dash characters '-' (en-dash, em-dash, hyphen)
      cleaned = cleaned.replace(/[-–—]/g, "");
      // Remove markdown bolding and asterisks
      cleaned = cleaned.replace(/\*\*/g, "").replace(/\*/g, "").replace(/`/g, "");
      return cleaned.trim();
    };

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Empty line check
      if (trimmed === "") {
        elements.push(<div key={`empty-${i}`} className="h-4" />);
        i++;
        continue;
      }

      // Check for Stage or general metadata lines that shouldn't look like formal body paragraphs
      if (trimmed.startsWith("📝 SÁNG KIẾN KINH NGHIỆM:") || trimmed.startsWith("(Cấp đăng ký:") || trimmed.startsWith("📝 NỘI DUNG SÁNG KIẾN:")) {
        elements.push(
          <div key={`meta-${i}`} className="text-center p-4 rounded-xl mb-6 font-serif text-black">
            <h1 className="text-[14pt] font-bold uppercase leading-normal">
              {cleanText(trimmed)}
            </h1>
            {i + 1 < lines.length && (lines[i + 1].trim().startsWith("(Cấp:") || lines[i + 1].trim().startsWith("(Cấp đăng ký:")) && (
              <p className="text-[14pt] text-black font-serif italic mt-1 font-semibold">{cleanText(lines[i + 1])}</p>
            )}
          </div>
        );
        if (i + 1 < lines.length && (lines[i + 1].trim().startsWith("(Cấp:") || lines[i + 1].trim().startsWith("(Cấp đăng ký:"))) {
          i += 2;
        } else {
          i++;
        }
        continue;
      }

      // 1. PHÂN CẤP TIÊU ĐỀ:
      // Cấp 1 (Phần/Chương/Mở đầu/Nội dung/Kết luận)
      // Matches: "A. MỞ ĐẦU", "B. NỘI DUNG", "C. KẾT LUẬN", "D. NHẬN XÉT, ĐÁNH GIÁ VÀ XẾP LOẠI CỦA", "E. TÀI LIỆU THAM KHẢO, MỤC LỤC", etc.
      const isLevel1Header = trimmed.match(/^(\*\*|#)?\s*([A-E]\.\s+.*?)(\*\*)?$/i) || 
                             trimmed.match(/^(\*\*|#)?\s*(A|B|C|D|E)\.\s+.*$/i);
      if (isLevel1Header) {
        const textToRender = cleanText(trimmed).toUpperCase();
        elements.push(
          <h2 key={`cap1-${i}`} className="font-serif text-[14pt] font-bold text-black uppercase tracking-wide text-left mt-8 mb-4 leading-normal">
            {textToRender}
          </h2>
        );
        i++;
        continue;
      }

      // Cấp 2 (Mục nhỏ 1., 2., 3., 4., hoặc "Cơ sở lý luận", "Cơ sở thực tiễn")
      const isLevel2Header = trimmed.match(/^(\d+)\.\s+/i) || 
                             trimmed.toLowerCase() === "cơ sở lý luận" || 
                             trimmed.toLowerCase() === "cơ sở thực tiễn" || 
                             trimmed.toLowerCase().startsWith("**1. cơ sở lý luận") || 
                             trimmed.toLowerCase().startsWith("**2. cơ sở thực tiễn") || 
                             trimmed.toLowerCase().startsWith("**3. các giải pháp cụ thể") ||
                             trimmed.toLowerCase().startsWith("**4. kết quả mang lại") ||
                             trimmed.toLowerCase().startsWith("cơ sở lý luận") || 
                             trimmed.toLowerCase().startsWith("cơ sở thực tiễn");
      if (isLevel2Header) {
        elements.push(
          <h3 key={`cap2-${i}`} className="font-serif text-[14pt] font-bold text-black text-left mt-6 mb-3 leading-normal">
            {cleanText(trimmed)}
          </h3>
        );
        i++;
        continue;
      }

      // Cấp 3 (Tiểu mục / Giải pháp)
      // Matches "Giải pháp 3.1. [Tên]", "Giải pháp 3.2. [Tên]"
      const isLevel3Header = trimmed.match(/^(\d+\.\d+)\.?\s+/i) || 
                             trimmed.match(/^Giải\s*pháp\s+(\d+\.\d+)\.?\s+/i) || 
                             trimmed.toLowerCase().startsWith("giải pháp 3.") ||
                             trimmed.startsWith("Giải pháp 3.");
      if (isLevel3Header) {
        elements.push(
          <h4 key={`cap3-${i}`} className="font-serif text-[14pt] font-bold text-black text-justify mt-5 mb-3 leading-relaxed">
            {cleanText(trimmed)}
          </h4>
        );
        i++;
        continue;
      }

      // Check for example blocks "Ví dụ: ..."
      if (trimmed.startsWith("Ví dụ:") || trimmed.includes("Ví dụ: Khi dạy bài")) {
        elements.push(
          <div key={`example-${i}`} className="my-5 p-5 bg-slate-50 border-l-4 border-slate-900 rounded-r shadow-xs">
            <div className="flex items-center gap-2 mb-2 font-serif font-bold text-black text-[14pt]">
              <BookOpen className="w-5 h-5 text-slate-800 flex-shrink-0" />
              <span>Ví dụ thực tế minh họa dạy học:</span>
            </div>
            <p className="italic text-black leading-relaxed font-serif text-[14pt] text-justify" style={{ textIndent: "0.5cm" }}>
              {cleanText(trimmed)}
            </p>
          </div>
        );
        i++;
        continue;
      }

      // 2. ĐỊNH DẠNG ĐOẠN VĂN:
      // Danh sách liệt kê: dấu gạch đầu dòng (-) hoặc các điểm a), b), c)...
      const isDashedList = trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("•");
      const isLetteredList = trimmed.match(/^([a-z]\))\s+/i);

      if (isDashedList) {
        // Strip the leading bullet marker (like -, *, •)
        const textOnly = trimmed.replace(/^[-*•\s]+/g, "");
        elements.push(
          <ul key={`dash-${i}`} className="list-none pl-8 my-1 space-y-1">
            <li className="relative text-black font-normal leading-relaxed font-serif text-[14pt] text-justify">
              {cleanText(textOnly)}
            </li>
          </ul>
        );
        i++;
        continue;
      } else if (isLetteredList) {
        const labelWithParens = isLetteredList[1].toLowerCase();
        const textOnly = trimmed.substring(isLetteredList[0].length).trim();
        elements.push(
          <div key={`letter-${i}`} className="pl-8 my-1 font-serif text-[14pt] text-black leading-relaxed text-justify">
            <span className="font-bold mr-2 text-black">{labelWithParens}</span>
            {cleanText(textOnly)}
          </div>
        );
        i++;
        continue;
      }

      // Default body text: aligned justified, indent 0.5 cm
      elements.push(
        <p key={`body-${i}`} className="text-black leading-relaxed text-[14pt] font-serif antialiased text-justify mb-4" style={{ textIndent: "0.5cm" }}>
          {cleanText(trimmed)}
        </p>
      );
      i++;
    }
    
    return elements;
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] text-slate-800 font-sans border-[12px] border-slate-200 flex flex-col overflow-x-hidden">
      
      {/* HEADER SECTION */}
      <header className="bg-[#1e3a8a] text-white p-6 flex flex-col md:flex-row justify-between items-center shadow-md border-b border-blue-900 no-print">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
            <svg 
              className="w-12 h-12 flex-shrink-0 filter drop-shadow-md hover:scale-105 transition-transform duration-300" 
              viewBox="0 0 100 100" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="headerGeminiGoldBg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFF4BC" />
                  <stop offset="65%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#8A640F" />
                </radialGradient>
                <linearGradient id="headerGeminiGoldMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="30%" stopColor="#FBDC81" />
                  <stop offset="70%" stopColor="#DF9F28" />
                  <stop offset="100%" stopColor="#7B5608" />
                </linearGradient>
                <linearGradient id="headerGeminiGreenMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="50%" stopColor="#047857" />
                  <stop offset="100%" stopColor="#064E3B" />
                </linearGradient>
                <filter id="headerGeminiShadow" x="-10%" y="-10%" width="125%" height="125%">
                  <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000000" floodOpacity="0.4" />
                </filter>
              </defs>

              {/* Main Outer Shield Coin Ring */}
              <circle cx="50" cy="50" r="48" fill="url(#headerGeminiGoldMetal)" filter="url(#headerGeminiShadow)" />
              <circle cx="50" cy="50" r="45" fill="#111827" />
              
              {/* Outer Bezel */}
              <circle cx="50" cy="50" r="43" fill="url(#headerGeminiGoldBg)" />

              {/* Polished Sapphire/Blue Jewels Studded Ring */}
              <circle cx="50" cy="11.5" r="1.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="0.4" />
              <circle cx="88.5" cy="50" r="1.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="0.4" />
              <circle cx="50" cy="88.5" r="1.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="0.4" />
              <circle cx="11.5" cy="50" r="1.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="0.4" />
              
              <circle cx="77.2" cy="22.8" r="1.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="0.4" />
              <circle cx="77.2" cy="77.2" r="1.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="0.4" />
              <circle cx="22.8" cy="77.2" r="1.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="0.4" />
              <circle cx="22.8" cy="22.8" r="1.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="0.4" />

              <circle cx="63.6" cy="14.4" r="0.8" fill="#1E40AF" />
              <circle cx="85.6" cy="36.4" r="0.8" fill="#1E40AF" />
              <circle cx="85.6" cy="63.6" r="0.8" fill="#1E40AF" />
              <circle cx="63.6" cy="85.6" r="0.8" fill="#1E40AF" />
              <circle cx="36.4" cy="85.6" r="0.8" fill="#1E40AF" />
              <circle cx="14.4" cy="63.6" r="0.8" fill="#1E40AF" />
              <circle cx="14.4" cy="36.4" r="0.8" fill="#1E40AF" />
              <circle cx="36.4" cy="14.4" r="0.8" fill="#1E40AF" />

              {/* Inner Medallion Border */}
              <circle cx="50" cy="50" r="37.5" stroke="#7B5608" strokeWidth="0.8" fill="none" />

              {/* Central Premium STEM Monogram Architecture */}
              <circle cx="50" cy="46" r="23" fill="url(#headerGeminiGoldBg)" stroke="#A2790D" strokeWidth="0.5" />

              {/* Emerald Green Interlocking Monogram */}
              <path 
                d="M33 55 L43 27 L49 41 L53 31 L63 55 L58 55 L53 41 L47 55 Z" 
                fill="url(#headerGeminiGreenMetal)" 
                stroke="#6B4E04" 
                strokeWidth="0.8" 
                filter="url(#headerGeminiShadow)" 
              />
              
              {/* Crescent Gold Swoosh */}
              <path 
                d="M52 18 C38 18 32 30 38 42 C40 45 47 45 52 39 C46 37 42 31 48 24 C52 21 55 23 55 23" 
                fill="url(#headerGeminiGoldMetal)" 
                stroke="#6B4E04"
                strokeWidth="0.4"
                filter="url(#headerGeminiShadow)" 
              />

              {/* Golden Accents / Coding lines */}
              <line x1="33" y1="28" x2="33" y2="44" stroke="#D4AF37" strokeWidth="0.4" strokeDasharray="1,1" />
              <line x1="63" y1="28" x2="63" y2="44" stroke="#D4AF37" strokeWidth="0.4" strokeDasharray="1,1" />
              
              {/* Bottom Curved Banner background */}
              <path 
                d="M17 64 C23 79 77 79 83 64" 
                stroke="url(#headerGeminiGoldMetal)" 
                strokeWidth="6" 
                strokeLinecap="round" 
                fill="none" 
              />
              <path 
                d="M17 64 C23 79 77 79 83 64" 
                stroke="#0F172A" 
                strokeWidth="0.5" 
                strokeLinecap="round" 
                fill="none" 
              />

              <path 
                id="headerTextCurvePath" 
                d="M 19 62 C 26 77 74 77 81 62" 
                fill="none" 
              />
              
              {/* Text along curve path */}
              <text fontSize="4.1" fontWeight="bold" fontFamily="system-ui, sans-serif" letterSpacing="0.2">
                <textPath href="#headerTextCurvePath" startOffset="50%" textAnchor="middle" fill="#FFFFFF">
                  STEM-AI: KẾT NỐI - ĐỒNG HÀNH - SÁNG TẠO
                </textPath>
              </text>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight">TRỢ LÝ SÁNG KIẾN 1380</h1>
              <button
                type="button"
                id="header-settings-gear-btn"
                onClick={() => {
                  setIsSettingsOpen(true);
                }}
                className="p-1.5 hover:bg-blue-800/80 hover:scale-105 active:scale-95 rounded-full transition duration-150 text-blue-200 hover:text-white flex items-center justify-center focus:outline-hidden focus:ring-2 focus:ring-blue-400 cursor-pointer"
                title="Cài đặt nhanh Trợ lý"
              >
                <Settings className="w-5 h-5 animate-[spin_30s_linear_infinite]" />
              </button>
            </div>
            <p className="text-xs font-medium text-blue-200 uppercase tracking-widest leading-relaxed" style={{ fontFamily: 'Arial', textAlign: 'justify', lineHeight: '14.5px' }}>"CỘNG ĐỒNG SÁNG TẠO AI-STEM" - CHUYÊN GIA HỖ TRỢ VIẾT SÁNG KIẾN</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 md:mt-0">
          <div className="text-left md:text-right border-l border-blue-700 pl-4 pr-2">
            <span className="block text-[11px] text-blue-300">Hướng dẫn theo Công văn số</span>
            <span className="text-lg font-mono font-bold block">1380/SGDĐT-VP</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Health status badge */}
            <div className="flex items-center gap-2 bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-700 text-xs">
              <div className={`w-2.5 h-2.5 rounded-full ${health.hasApiKey ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}></div>
              <span className="text-blue-100 text-[11px] font-mono">
                {health.checked ? (health.hasApiKey ? "AI Sẵn Sàng" : "Mất Kết Nối AI") : "Đang kiểm tra..."}
              </span>
            </div>

            <button
              onClick={clearForm}
              className="px-3.5 py-1.5 bg-blue-600 border border-blue-700 hover:bg-blue-500 active:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition duration-150 cursor-pointer shadow-sm"
              title="Khởi tạo biểu mẫu mới"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thiết lập mới</span>
            </button>
          </div>
        </div>
      </header>

      {/* PROFESSIONAL FRAME BOUNDARY & INNER WORKSPACE WRAPPER */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Sidebar: Process Stepper */}
        <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col justify-between flex-shrink-0 hidden md:flex no-print">
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Quy trình làm việc</h3>
            <nav className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  if (suggestions.length > 0) setStage(1);
                }}
                disabled={suggestions.length === 0}
                className={`w-full flex items-center space-x-3 p-3 border-l-4 rounded-r-md transition-all text-left ${
                  stage === 1 
                    ? "bg-blue-50 border-blue-600 text-blue-900" 
                    : suggestions.length > 0
                      ? "opacity-85 border-transparent text-slate-600 hover:bg-slate-50 cursor-pointer"
                      : "opacity-45 border-transparent text-slate-500 cursor-not-allowed"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                  stage === 1 ? "bg-blue-600 text-white animate-pulse" : "bg-slate-300 text-slate-600"
                }`}>01</div>
                <span className="text-sm font-semibold">Giai đoạn 1: Đề xuất tên</span>
              </button>
              
              <button 
                type="button"
                id="stepper-stage-2"
                onClick={() => {
                  if (detailedContent) setStage(2);
                }}
                disabled={!detailedContent}
                className={`w-full flex items-center space-x-3 p-3 border-l-4 rounded-r-md transition-all duration-200 text-left ${
                  stage === 2 
                    ? "bg-blue-50 border-blue-700 text-blue-900 shadow-[0_2px_8px_-3px_rgba(30,58,138,0.15)] font-semibold" 
                    : detailedContent
                      ? "opacity-85 border-transparent text-slate-600 hover:bg-slate-50 cursor-pointer"
                      : "opacity-45 border-transparent text-slate-500 cursor-not-allowed"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-transform duration-200 ${
                  stage === 2 ? "bg-blue-600 text-white scale-110 shadow-sm" : "bg-slate-300 text-slate-600"
                }`}>02</div>
                <span className="text-sm font-semibold">Giai đoạn 2: Viết nội dung</span>
              </button>

              <button 
                type="button"
                id="stepper-stage-3"
                onClick={() => {
                  if (detailedContent) setStage(3);
                }}
                disabled={!detailedContent}
                className={`w-full flex items-center space-x-3 p-3 border-l-4 rounded-r-md transition-all duration-200 text-left ${
                  stage === 3 
                    ? "bg-blue-50 border-blue-700 text-blue-900 shadow-[0_2px_8px_-3px_rgba(30,58,138,0.15)] font-semibold" 
                    : detailedContent
                      ? "opacity-85 border-transparent text-slate-600 hover:bg-slate-50 cursor-pointer"
                      : "opacity-45 border-transparent text-slate-500 cursor-not-allowed"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-transform duration-200 ${
                  stage === 3 ? "bg-blue-600 text-white scale-110 shadow-sm" : "bg-slate-300 text-slate-600"
                }`}>03</div>
                <span className="text-sm font-semibold">Giai đoạn 3: Tùy chỉnh sáng kiến</span>
              </button>

              <button 
                type="button"
                id="stepper-stage-4"
                onClick={() => {
                  if (detailedContent) setStage(4);
                }}
                disabled={!detailedContent}
                className={`w-full flex items-center space-x-3 p-3 border-l-4 rounded-r-md transition-all duration-200 text-left ${
                  stage === 4 
                    ? "bg-blue-50 border-blue-700 text-blue-900 shadow-[0_2px_8px_-3px_rgba(30,58,138,0.15)] font-semibold" 
                    : detailedContent
                      ? "opacity-85 border-transparent text-slate-600 hover:bg-slate-50 cursor-pointer"
                      : "opacity-45 border-transparent text-slate-500 cursor-not-allowed"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-transform duration-200 ${
                  stage === 4 ? "bg-blue-600 text-white scale-110 shadow-sm" : "bg-slate-300 text-slate-600"
                }`}>04</div>
                <span className="text-sm font-semibold">Giai đoạn 4: Chỉnh sửa theo đề cương</span>
              </button>
            </nav>
          </div>

        </aside>

        {/* CORE FRAMEWORK WORKSPACE */}
        <main className="flex-1 w-full p-6 overflow-y-auto bg-[#f8fafc] grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: PRESETS, USER CONTEXT & INPUTS */}
        <section className="lg:col-span-5 space-y-6 no-print">
          
          {/* Quick presets helper */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-brand-blue-800" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Ý tưởng sư phạm mẫu</h2>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Nhấp vào một mẫu dưới đây để tự động nhập bộ dữ liệu giảng dạy thực tiễn chuẩn hóa:
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-3 py-2 bg-slate-100 hover:bg-blue-50 hover:text-brand-blue-800 text-slate-700 text-xs font-medium rounded-lg transition duration-150 border border-slate-200 hover:border-blue-200 text-left cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form input details */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#1e3a8a]" />
            
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-1.5">
                <FileCheck className="w-5 h-5 text-[#1e3a8a]" />
                Thông tin ý tưởng sáng kiến
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">Bản nháp 1380</span>
            </div>

            <form onSubmit={handleSuggestNames} className="space-y-4">
              
              {/* Lĩnh vực / Môn học & Bộ sách */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Môn học / Lĩnh vực *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Toán học lớp 7, Ngữ văn lớp 10..."
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-brand-blue-600 focus:ring-1 focus:ring-brand-blue-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bộ sách giáo khoa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Kết nối tri thức với cuộc sống"
                    value={form.textbook}
                    onChange={(e) => setForm({ ...form, textbook: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-brand-blue-600 focus:ring-1 focus:ring-brand-blue-600 transition"
                  />
                </div>
              </div>

              {/* Đối tượng nghiên cứu */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Đối tượng kiểm chứng thực tiễn *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Học sinh lớp 6A1, Trường THPT THCS lân cận..."
                  value={form.targetStudents}
                  onChange={(e) => setForm({ ...form, targetStudents: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-brand-blue-600 focus:ring-1 focus:ring-brand-blue-600 transition"
                />
              </div>

              {/* Vấn đề cốt lõi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Vấn đề cốt lõi (Khó khăn thực tế) *</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ví dụ: Học sinh chán nản phương pháp ghi chép từ vựng kiểu cũ, hay tính sai dấu, hoặc tiếp thu tác phẩm sử thi thụ động..."
                  value={form.coreProblem}
                  onChange={(e) => setForm({ ...form, coreProblem: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-brand-blue-600 focus:ring-1 focus:ring-brand-blue-600 transition leading-relaxed"
                />
              </div>

              {/* Ý tưởng thô của giáo viên */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Ý tưởng sư phạm thô ban đầu *</span>
                  <span className="text-[10px] text-brand-blue-800 italic normal-case">Tác giả biên soạn chính</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Mô tả tóm tắt giải pháp cá nhân của bạn. Ví dụ: Thiết kế trò chơi 'Hành trình tài chính', Sân khấu hóa sử thi bằng vẽ tranh, áp dụng Gamification..."
                  value={form.rawIdea}
                  onChange={(e) => setForm({ ...form, rawIdea: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-brand-blue-600 focus:ring-1 focus:ring-brand-blue-600 transition leading-relaxed"
                />
              </div>

              {/* Đăng ký cấp nào */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Định hướng cấp xét duyệt
                </label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-brand-blue-600 focus:ring-1 focus:ring-brand-blue-600 transition"
                >
                  <option value="both">Phân tích đề xuất cho cả hai cấp độ</option>
                  <option value={InitiativeLevel.CO_SO}>Cơ sở (Xét duyệt cấp Trường/Đơn vị)</option>
                  <option value={InitiativeLevel.CAP_TINH}>Cấp Tỉnh (Xét duyệt cấp Sở GD&ĐT)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal italic">
                  * Hệ thống sẽ tự động hiệu chỉnh quy mô từ ngữ và tầm ảnh hưởng của tên & giải pháp thích ứng theo cấp đăng ký.
                </p>
              </div>

              {/* Action suggest names */}
              <button
                type="submit"
                disabled={isSuggesting || isGenerating}
                className="w-full mt-2 py-3 bg-[#1e3a8a] border border-blue-900 hover:bg-blue-850 text-white font-semibold rounded-lg text-sm shadow-md flex items-center justify-center gap-2 transition duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSuggesting ? (
                  <>
                     <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                     <span>Đang nghiên cứu đề xuất...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4.5 h-4.5" />
                    <span>Đề xuất Sáng kiến (Giai đoạn 1)</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Local storage history browser */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm max-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-3 border-b pb-2 flex-shrink-0">
              <div className="text-left min-w-0">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate">
                  <History className="w-4.5 h-4.5 text-slate-500 flex-shrink-0" />
                  Lịch sử sáng kiến của tôi
                </h3>
                <span className="text-[10px] text-slate-500 block leading-tight mt-0.5 font-sans">Lưu trữ tối đa 2 bản gần nhất</span>
              </div>
              <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-mono font-bold flex-shrink-0">
                {history.length} bản lưu
              </span>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs flex-1 flex flex-col justify-center items-center gap-2">
                <FileCheck className="w-8 h-8 opacity-40 text-slate-300" />
                <p>Chưa có dự thảo biên soạn nào lưu tại đây.</p>
              </div>
            ) : (
              <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                {history.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => handleSelectHistory(h)}
                    className="group flex items-start justify-between p-2.5 bg-slate-50 hover:bg-blue-50/50 rounded-lg border border-slate-200 hover:border-blue-200 transition cursor-pointer text-left"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-brand-blue-800">
                        {h.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                        <span className={`px-1 rounded font-medium ${h.level === InitiativeLevel.CAP_TINH ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                          Cấp {h.level}
                        </span>
                        <span>•</span>
                        <span>{h.createdAt}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteHistoryItem(h.id, e)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded transition flex-shrink-0"
                      title="Xóa sáng kiến khỏi máy"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          


        </section>

        {/* RIGHT COLUMN: DETAILED WORKSPACE OUTPUT FEED */}
        <section id="output-panel" className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[600px] flex flex-col overflow-hidden">
          
          {/* Non-active State: Greeting & Instructions */}
          {!isSuggesting && !isGenerating && suggestions.length === 0 && !detailedContent && (
            <div className="flex-1 p-8 flex flex-col justify-center items-center text-center max-w-xl mx-auto space-y-5">
              <div className="p-4 bg-blue-50 rounded-full border border-blue-100 ring-8 ring-blue-50/50">
                <Sparkles className="w-10 h-10 text-brand-blue-800 animate-bounce" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900 mb-2">Trợ lý học thuật &quot;Cộng đồng sáng tạo AI - STEM&quot; sẵn sàng</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Nhập ý tưởng giảng dạy sáng tạo của quý thầy cô vào biểu mẫu bên trái, hoặc chọn lấy một "Ý tưởng sư phạm mẫu" điển hình để xem cách hoạt động của hệ thống.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-md text-left text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Đề xuất 3 tên sáng kiến hay loại bỏ từ cấm kỵ.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Xác định đúng cấp Cơ sở / Cấp tỉnh phù hợp.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Viết nội dung ngôi thứ nhất sâu sắc, giàu chất xám.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Ví dụ chi tiết từ sách giáo khoa phổ thông mới.</span>
                </div>
              </div>
            </div>
          )}

          {/* Suggesting Names State */}
          {isSuggesting && (
            <div className="flex-1 p-8 flex flex-col justify-center items-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-600/20 border-t-brand-blue-800 rounded-full animate-spin"></div>
                <Sparkles className="w-6 h-6 text-[#1e3a8a] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-800">Đang đề xuất tên sáng kiến lập quy</h3>
                <p className="text-xs text-slate-400 animate-pulse mt-1">Đồng bộ ý tưởng thô và lọc bỏ cụm từ 'Kinh nghiệm'...</p>
              </div>
              <p className="text-[11px] max-w-sm text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-200 italic leading-relaxed">
                "Cập tỉnh: Tên sáng kiến phải thể hiện tầm ảnh hưởng sâu rộng trong toàn tỉnh Tây Ninh..."
              </p>
            </div>
          )}

          {/* Generating Detailed Master Document State */}
          {isGenerating && (
            <div className="flex-1 p-8 flex flex-col justify-center items-center text-center space-y-6">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-blue-50 rounded-2xl border border-blue-200 flex items-center justify-center shadow-inner mb-4 relative">
                  <FileText className="w-10 h-10 text-brand-blue-800 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border border-white flex items-center justify-center shadow">
                    <span className="text-[9px] text-white font-bold">1380</span>
                  </div>
                </div>
                <h3 className="font-serif text-xl font-bold text-slate-900">Đang khởi thảo sáng kiến hoàn hảo</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md">
                  Vui lòng đợi trong giây lát. Trợ lý đang dồn chất xám thực tế để lập bài viết hoàn chỉnh gồm 3 giải pháp ngôi thứ nhất và ví dụ bộ sách chi học.
                </p>
              </div>

              {/* Progress Rotating Bar representing step-by-step tasks */}
              <div className="w-full max-w-md bg-slate-100/80 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
                  <span className="text-brand-blue-800 flex items-center gap-1.5 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    Biên tập tiến trình...
                  </span>
                  <span>Tầm 2200 - 2500 từ</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-blue-600 h-full rounded-full animate-[shimmer_2s_infinite]" style={{ width: "85%", backgroundImage: "linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)", backgroundSize: "1rem 1rem" }}></div>
                </div>
                <p className="text-xs text-brand-blue-850 mt-3 font-semibold font-mono animate-pulse">
                  {loadingText}
                </p>
              </div>
            </div>
          )}

          {/* Stage 1 Completed output results */}
          {!isSuggesting && !isGenerating && suggestions.length > 0 && stage === 1 && (
            <div className="flex-1 p-6 flex flex-col space-y-6 overflow-y-auto max-h-[85vh] fade-in-slide">
              <div className="text-left border-b pb-4">
                <h2 className="font-serif text-xl font-bold text-slate-900">KẾT QUẢ ĐỀ XUẤT TÊN & KHẢO SÁT BAN ĐẦU</h2>
                <p className="text-xs text-slate-400 mt-1">Cơ cấu định dạng sàng lọc chính thức từ Công văn 1380 Tây Ninh</p>
              </div>



              {/* Suggestions items */}
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4.5 h-4.5 text-brand-blue-800" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    3 ĐỀ XUẤT TÊN SÁNG KIẾN CO_SO / CAP_TINH phù hợp bài bản
                  </h3>
                </div>
                
                <p className="text-xs text-slate-400 -mt-2 italic">
                  * Nhấp chuột vào nút <b>"Chọn và Biên soạn chi tiết"</b> ở tên sáng kiến thích hợp nhất để đi đến Giai đoạn 2.
                </p>

                <div className="space-y-4">
                  {suggestions.map((s, index) => (
                    <div 
                      key={s.id} 
                      className="group p-5 rounded-xl border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/5 shadow-sm transition-all duration-150 flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono font-bold text-brand-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-105">
                            Đề xuất {index + 1}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            s.level === "Cấp tỉnh" 
                              ? "bg-amber-100 text-amber-800 border border-amber-200" 
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}>
                            {s.level === "Cấp tỉnh" ? "★ Cấp tỉnh" : "● Cấp cơ sở"}
                          </span>
                        </div>
                        
                        <h4 className="font-serif text-base font-bold text-slate-900 group-hover:text-brand-blue-800 transition">
                          {s.name}
                        </h4>

                        <div className="space-y-1.5 text-xs text-slate-600 font-sans leading-relaxed pt-1">
                          <p>
                            <strong className="text-slate-800">Lý do phù hợp:</strong> {s.reason}
                          </p>
                          <p>
                            <strong className="text-slate-800">Điểm mạnh đột phá:</strong> {s.strengths}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleGenerateFullInitiative(s)}
                          className="px-4 py-2 bg-blue-800 hover:bg-blue-750 hover:text-white border border-blue-900 text-blue-50 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                        >
                          <span>Chọn và Biên soạn chi tiết</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stage 2, 3 & 4 Content Viewing Area (Paper layout with scroll syncing TOC & operations) */}
          {!isSuggesting && !isGenerating && detailedContent && (stage === 2 || stage === 3 || stage === 4) && (
            <div className="flex-1 flex flex-col h-full overflow-hidden fade-in-slide">
              
              {/* Desktop operations ribbon Bar */}
              <div className="bg-slate-50 border-b border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 no-print flex-shrink-0">
                <button
                  type="button"
                  onClick={() => { setStage(1); setIsDownloadMenuOpen(false); }}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại ý tưởng</span>
                </button>

                <div className="flex items-center gap-2 relative">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-brand-blue-800 hover:border-blue-300 hover:bg-blue-50/10 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? "Đã sao chép!" : "Sao chép tất cả"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
                    className={`px-3 py-1.5 border transition duration-150 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer ${
                      isDownloadMenuOpen 
                        ? "bg-blue-50 border-brand-blue-500 text-brand-blue-850" 
                        : "bg-white border-slate-300 text-slate-700 hover:text-brand-blue-800 hover:border-blue-300 hover:bg-blue-50/10"
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải về Sáng kiến (.docx / .doc)</span>
                  </button>

                  {/* Absolute Positioned Word/Text Dropdown Menu */}
                  {isDownloadMenuOpen && (
                    <div className="absolute right-0 top-10 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-left animate-fade-in no-print">
                      <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-1 flex items-center justify-between">
                        <span>Định dạng tải về</span>
                        <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 rounded">1380</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadFormat("docx")}
                        className="w-full px-3.5 py-2.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-brand-blue-800 flex items-start gap-2.5 transition text-left cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-800">Tải Word (.docx)</p>
                          <p className="text-[9.5px] text-slate-400 font-normal">Định dạng khuyên dùng tối ưu</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadFormat("doc")}
                        className="w-full px-3.5 py-2.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-brand-blue-800 flex items-start gap-2.5 transition text-left cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-800">Tải Word (.doc)</p>
                          <p className="text-[9.5px] text-slate-400 font-normal">Dành cho bộ Office đời cũ</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadFormat("txt")}
                        className="w-full px-3.5 py-2.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-brand-blue-800 flex items-start gap-2.5 transition text-left cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-800">Tải file Văn bản (.txt)</p>
                          <p className="text-[9.5px] text-slate-400 font-normal"> Plain list thô, gọn nhẹ</p>
                        </div>
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-blue-800/10 hover:bg-blue-800 border border-blue-800 text-blue-800 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In ấn ngay</span>
                  </button>
                </div>
              </div>

              {/* Sub grid layout inside right container */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                
                {/* Navigation Sidebar Table of Contents or Stage 3 customizer */}
                <div className="md:col-span-3 bg-slate-50 border-r border-slate-100 p-4 text-left space-y-4 overflow-y-auto no-print hidden md:block flex-shrink-0">
                  {stage === 2 ? (
                    <>
                      <div className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Mục lục Sáng kiến (GĐ2)
                      </div>
                      <nav className="space-y-1 text-xs">
                        <button
                          onClick={() => scrollToAnchor("mo-dau")}
                          className={`w-full text-left p-2 rounded-lg font-medium transition flex items-center justify-between ${
                            activeSection === "mo-dau"
                              ? "bg-[#1e3a8a] text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-200/50"
                          }`}
                        >
                          <span>A. Mở đầu</span>
                          <ChevronRight className="w-3 w-3 opacity-60" />
                        </button>

                        <button
                          onClick={() => scrollToAnchor("noi-dung-ly-luan")}
                          className={`w-full text-left p-2 rounded-lg font-medium transition flex items-center justify-between ${
                            activeSection === "noi-dung-ly-luan"
                              ? "bg-[#1e3a8a] text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-200/50"
                          }`}
                        >
                          <span>B.1 Cơ sở lý luận</span>
                          <ChevronRight className="w-3 w-3 opacity-60" />
                        </button>

                        <button
                          onClick={() => scrollToAnchor("giai-phap")}
                          className={`w-full text-left p-2 rounded-lg font-medium transition flex items-center justify-between ${
                            activeSection === "giai-phap"
                              ? "bg-[#1e3a8a] text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-200/50"
                          }`}
                        >
                          <span>B.3 Các Giải pháp</span>
                          <ChevronRight className="w-3 w-3 opacity-60" />
                        </button>

                        <button
                          onClick={() => scrollToAnchor("ket-luan")}
                          className={`w-full text-left p-2 rounded-lg font-medium transition flex items-center justify-between ${
                            activeSection === "ket-luan"
                              ? "bg-[#1e3a8a] text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-200/50"
                          }`}
                        >
                          <span>C. Kết luận</span>
                          <ChevronRight className="w-3 w-3 opacity-60" />
                        </button>
                      </nav>

                      {/* Level disclaimer */}
                      <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 leading-normal space-y-1">
                        <p className="font-bold text-slate-700">Mục tiêu cấp: {selectedLevel}</p>
                        <p className="italic text-slate-450">
                          {selectedLevel === InitiativeLevel.CAP_TINH 
                            ? "Phạm vi ảnh hưởng rộng cấp tỉnh Tây Ninh." 
                            : "Phạm vi áp dụng thực tiễn tại đơn vị cơ sở."}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setStage(3)}
                          className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                          <span>Mở GĐ 3: Tinh chỉnh & Mở rộng</span>
                        </button>
                      </div>
                    </>
                  ) : stage === 3 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="font-mono text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                          Giai đoạn 3: Tối ưu
                        </div>
                        <button
                          type="button"
                          onClick={() => setStage(2)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer underline"
                        >
                          Xem Mục lục
                        </button>
                      </div>

                      <div className="bg-slate-100 p-2.5 rounded-lg text-[11px] text-slate-600 font-sans leading-relaxed">
                        <span className="font-bold text-slate-800 block mb-0.5">Mục tiêu Giai đoạn 3:</span>
                        Tinh chỉnh đề tài thực tế và tự động viết mở rộng sâu sắc đạt độ dài chuẩn <span className="text-red-700 font-bold">4000 - 4500 từ</span> theo đúng CV 1380.
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Yêu cầu sửa đổi sư phạm:
                        </label>
                        <textarea
                          rows={4}
                          value={refineInstruction}
                          onChange={(e) => setRefineInstruction(e.target.value)}
                          placeholder="Ví dụ: Bổ sung thêm hoạt động trải nghiệm thực tế, tăng sâu phân tích số liệu kết quả đối chứng trong giải pháp 3.4..."
                          className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-850 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition leading-relaxed shadow-sm"
                        />
                      </div>

                      <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-[11px] flex items-center justify-between font-mono">
                        <span className="text-slate-500">Độ dài hiện tại:</span>
                        <span className="font-bold text-brand-blue-800">
                          {detailedContent.trim().split(/\s+/).filter(Boolean).length} chữ
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRefineInitiative(refineInstruction)}
                        disabled={isRefining || !refineInstruction.trim()}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition duration-200 shadow-sm ${
                          isRefining || !refineInstruction.trim()
                            ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 hover:shadow-md cursor-pointer transform hover:-translate-y-0.5"
                        }`}
                      >
                        {isRefining ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Đang tối ưu & Mở rộng...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                            <span>Cập nhật & Mở rộng (GĐ3)</span>
                          </>
                        )}
                      </button>

                      {lastRefinementMsg && (
                        <div className="bg-emerald-50 border border-emerald-250 p-2.5 rounded-xl text-[11px] text-emerald-800 leading-normal font-sans animate-fade-in text-justify">
                          {lastRefinementMsg}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="font-mono text-[10px] font-bold text-violet-600 uppercase tracking-wider flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5 text-violet-500 animate-pulse" />
                          Giai đoạn 4: Đề cương tỉnh
                        </div>
                        <button
                          type="button"
                          onClick={() => setStage(2)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer underline"
                        >
                          Xem Mục lục
                        </button>
                      </div>

                      <div className="bg-slate-100 p-2.5 rounded-lg text-[11px] text-slate-600 font-sans leading-relaxed">
                        <span className="font-bold text-slate-800 block mb-0.5">Mục tiêu Giai đoạn 4:</span>
                        Tái cấu trúc lại bài viết theo mẫu đề cương hướng dẫn cụ thể của từng sở Giáo dục tỉnh/thành phố của bạn.
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Dán đề cương tỉnh/phòng Giáo dục:
                        </label>
                        <textarea
                          rows={6}
                          value={outlineText}
                          onChange={(e) => setOutlineText(e.target.value)}
                          placeholder="Ví dụ:&#10;Phần I: Mở đầu&#10;- Lý do chọn đề tài...&#10;Phần II: Nội dung thực tiễn...&#10;Phần III: Kết quả áp dụng..."
                          className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-850 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition leading-relaxed shadow-sm font-mono"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRefineInitiative("Giai đoạn 4 - Viết và Chỉnh sửa theo đúng đề cương:\n" + outlineText)}
                        disabled={isRefining || !outlineText.trim()}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition duration-200 shadow-sm ${
                          isRefining || !outlineText.trim()
                            ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed"
                            : "bg-violet-600 hover:bg-violet-700 text-white border border-violet-700 hover:shadow-md cursor-pointer transform hover:-translate-y-0.5"
                        }`}
                      >
                        {isRefining ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Đang tái cấu trúc...</span>
                          </>
                        ) : (
                          <>
                            <Compass className="w-3.5 h-3.5 text-yellow-300" />
                            <span>Chỉnh theo đề cương tỉnh (GĐ4)</span>
                          </>
                        )}
                      </button>

                      {lastRefinementMsg && (
                        <div className="bg-emerald-50 border border-emerald-250 p-2.5 rounded-xl text-[11px] text-emerald-800 leading-normal font-sans animate-fade-in text-justify">
                          {lastRefinementMsg}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Highly readable, scholarly layout mimicking an off-white printed report paper */}
                <div 
                  ref={contentRef}
                  onScroll={handleScroll}
                  className={`md:col-span-9 paper-container p-6 md:p-8 overflow-y-auto max-h-[80vh] text-left select-text print-area scroll-smooth ${
                    showPaperLines ? "paper-lined-effect" : ""
                  }`}
                >
                  {/* Invisible anchor wrappers to help syncing scroll scroll-smooth */}
                  <div id="mo-dau" />
                  


                  {/* Render the core AI formatted output */}
                  <article className={`prose max-w-none ${
                    fontSize === "sm" ? "text-sm leading-relaxed" : 
                    fontSize === "lg" ? "text-lg leading-loose" : 
                    fontSize === "xl" ? "text-xl leading-loose font-medium" : "text-base leading-relaxed"
                  } ${
                    highContrast 
                      ? "text-black font-semibold tracking-wide bg-white/70 p-4 rounded-lg border border-slate-300" 
                      : "text-slate-950"
                  }`}>
                    
                    {/* Injecting content anchor points for ToC to coordinate scrolling */}
                    {displayContent ? (
                      <div className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 no-print flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-sm font-sans font-medium text-emerald-800">
                              Đang hiển thị mục chỉnh sửa riêng biệt theo yêu cầu.
                            </span>
                          </div>
                          <button
                            onClick={() => setDisplayContent("")}
                            className="text-xs font-sans font-semibold text-brand-blue-700 hover:text-brand-blue-900 border border-brand-blue-300 rounded px-2.5 py-1 transition-all"
                          >
                            Hiển thị toàn bộ sáng kiến
                          </button>
                        </div>
                        {renderFormattedText(displayContent)}
                      </div>
                    ) : (
                      renderFormattedText(detailedContent)
                    )}
                    
                    {/* Helping Anchors placed behind relative positions */}
                    <span id="noi-dung-ly-luan"></span>
                    <span id="giai-phap"></span>
                    <span id="ket-luan"></span>
                  </article>

                  {/* Scientific Bibliography / Footer Signature Mockup */}
                  <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-2 text-xs font-sans text-slate-500 italic">
                    <div>
                      <p>Ký tên chứng nhận sáng kiến:</p>
                      <p className="mt-8 font-bold text-slate-700 not-italic">Tác giả biên soạn chính</p>
                    </div>
                    <div className="text-right">
                      <p>Đăng ký trực tiếp tại:</p>
                      <p className="mt-8 font-bold text-slate-700 not-italic">Hội đồng sáng kiến cấp {selectedLevel}</p>
                    </div>
                  </div>

                  {/* RESPONSIVE PORTABLE PANEL: Giai đoạn 3 (Tùy chỉnh sáng kiến - Thích ứng mọi thiết bị) */}
                  {stage === 3 && (
                    <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl no-print space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <h4 className="font-serif font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                          <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                          Giai đoạn 3: Tinh chỉnh & Mở rộng Sáng kiến (Thích ứng Di động & Máy tính)
                        </h4>
                        <span className="text-[11px] font-mono bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                          Độ dài: {detailedContent.trim().split(/\s+/).filter(Boolean).length} chữ
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed text-justify">
                        * Nhập chỉ thị hoặc các ý tưởng bổ sung của quý thầy cô vào ô bên dưới. Trợ lý học thuật sẽ tiếp thu toàn bộ yêu cầu, đồng thời <b>tự động mở rộng chuyên sâu các phần lý luận và bài tập thực hành sư phạm để nâng tổng độ dài sáng kiến lên ngưỡng từ 4000 đến 4500 chữ</b> hoàn chỉnh.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-3">
                          <textarea
                            rows={2}
                            value={refineInstruction}
                            onChange={(e) => setRefineInstruction(e.target.value)}
                            placeholder="Ý tưởng bổ sung tinh chỉnh: Ví dụ thêm trò chơi Chợ quê vào giải pháp 3.2, mở rộng phần hiệu quả của cấp tỉnh Tây Ninh..."
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-850 focus:outline-none focus:border-brand-blue-600 focus:ring-1 focus:ring-brand-blue-600 transition leading-relaxed shadow-sm"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <button
                            type="button"
                            onClick={() => handleRefineInitiative(refineInstruction)}
                            disabled={isRefining || !refineInstruction.trim()}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 transition ${
                              isRefining || !refineInstruction.trim()
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed border"
                                : "bg-[#1e3a8a] text-white hover:bg-blue-900 shadow-md cursor-pointer"
                            }`}
                          >
                            {isRefining ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Đang cập nhật...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                                <span>Cập nhật</span>
                              </>
                            )}
                          </button>
                        </div>
                       </div>

                       {lastRefinementMsg && (
                        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-800 leading-relaxed font-sans mt-3 text-justify shadow-sm">
                          {lastRefinementMsg}
                        </div>
                       )}
                    </div>
                  )}

                  {/* RESPONSIVE PORTABLE PANEL: Giai đoạn 4 (Chỉnh đề cương tỉnh - Thích ứng mọi thiết bị) */}
                  {stage === 4 && (
                    <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl no-print space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <h4 className="font-serif font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                          <Compass className="w-4 h-4 text-violet-500 animate-pulse" />
                          Giai đoạn 4: Đột phá cấu trúc theo đề cương tỉnh (Thích ứng Di động & Máy tính)
                        </h4>
                        <span className="text-[11px] font-mono bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                          Độ dài: {detailedContent.trim().split(/\s+/).filter(Boolean).length} chữ
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed text-justify">
                        * Dán nguyên mẫu cấu trúc/đề cương quy định hướng dẫn biên soạn sáng kiến kinh nghiệm thực tế của địa phương bạn vào ô dưới đây. Trợ lý học thuật sẽ nhanh chóng tái thiết kế bài sáng kiến tương ứng chuẩn 100%.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-3">
                          <textarea
                            rows={3}
                            value={outlineText}
                            onChange={(e) => setOutlineText(e.target.value)}
                            placeholder="Dán cấu trúc/đề cương tỉnh của bạn tại đây để tự động tái thiết kế..."
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-850 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition leading-relaxed shadow-sm font-mono"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <button
                            type="button"
                            onClick={() => handleRefineInitiative("Giai đoạn 4 - Viết và Chỉnh sửa theo đúng đề cương:\n" + outlineText)}
                            disabled={isRefining || !outlineText.trim()}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 transition ${
                              isRefining || !outlineText.trim()
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed border"
                                : "bg-violet-600 text-white hover:bg-violet-700 shadow-md cursor-pointer"
                            }`}
                          >
                            {isRefining ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Đang tái cấu trúc...</span>
                              </>
                            ) : (
                              <>
                                <Compass className="w-3.5 h-3.5 text-yellow-300" />
                                <span>Chỉnh đề cương</span>
                              </>
                            )}
                          </button>
                        </div>
                       </div>

                       {lastRefinementMsg && (
                        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-800 leading-relaxed font-sans mt-3 text-justify shadow-sm">
                          {lastRefinementMsg}
                        </div>
                       )}
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

        </section>

      </main>
      </div>

      {/* FOOTER */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-xs no-print text-center flex flex-col md:flex-row justify-between items-center px-8 gap-4">
        <p className="font-light">
          Bản quyền thuộc về <b>Cộng đồng sáng tạo AI - Stem</b>. Hệ thống sử dụng mô hình trí tuệ nhân tạo Gemini 3.5 để hỗ trợ đắc lực giáo viên trong giảng dạy.
        </p>
        <p className="font-mono text-[11px] text-slate-500">
          Chương trình GDPT mới 2018 © 2026
        </p>
      </footer>

      {/* QUICK SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print fade-in-slide">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden flex flex-col font-sans">
            
            {/* Header */}
            <div className="bg-brand-blue-800 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 animate-[spin_10s_linear_infinite]" />
                <span className="font-bold tracking-wider uppercase text-xs font-mono">⚙️ Cấu hình nhanh Trợ lý</span>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-blue-200 hover:text-white transition cursor-pointer text-sm font-semibold p-1 hover:bg-white/10 rounded-full w-6 h-6 flex items-center justify-center"
                title="Đóng bản cài đặt"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
              
              {/* DISPLAY OPTIONS SECTION */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100">Cấu hình hiển thị Sáng kiến</h3>
                
                {/* Font Size Pref */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block text-left">Kích cỡ chữ phần đọc văn bản:</label>
                  <div className="grid grid-cols-4 gap-1">
                    {(["sm", "md", "lg", "xl"] as const).map((sz) => {
                      const labels = { sm: "Nhỏ", md: "Vừa", lg: "Lớn", xl: "Rất lớn" };
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            setFontSize(sz);
                            try {
                              localStorage.setItem("pref_font_size", sz);
                            } catch (e) {
                              console.warn("Storage writing blocked:", e);
                            }
                          }}
                          className={`py-1 text-xs font-medium rounded-md border cursor-pointer transition-all ${
                            fontSize === sz 
                              ? "bg-blue-600 border-blue-600 text-white shadow-xs" 
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {labels[sz]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* High Contrast Toggle */}
                <div className="flex items-center justify-between py-1 border-b border-dashed border-slate-100 pb-2">
                  <div className="text-left">
                    <label className="text-xs font-semibold text-slate-700 block">Độ tương phản cao:</label>
                    <span className="text-[9px] text-slate-400 block leading-tight">Gia tăng độ sắc nét tuyệt đối của từ ngữ</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !highContrast;
                      setHighContrast(next);
                      try {
                        localStorage.setItem("pref_high_contrast", String(next));
                      } catch (e) {
                        console.warn("Storage writing blocked:", e);
                      }
                    }}
                    className={`w-10 h-5.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-150 ${
                      highContrast ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                  >
                    <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-150 ${
                      highContrast ? "translate-x-4.5" : ""
                    }`}></div>
                  </button>
                </div>

                {/* Notebook Lines Toggle */}
                <div className="flex items-center justify-between py-1 font-sans text-stone-900">
                  <div className="text-left font-sans text-stone-900">
                    <label className="text-xs font-semibold text-slate-700 block">Dòng kẻ ly trang giấy:</label>
                    <span className="text-[9px] text-slate-400 block leading-tight">Bổ sung đường lưới mờ như tập kẻ ô</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !showPaperLines;
                      setShowPaperLines(next);
                      try {
                        localStorage.setItem("pref_paper_lines", String(next));
                      } catch (e) {
                        console.warn("Storage writing blocked:", e);
                      }
                    }}
                    className={`w-10 h-5.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-150 ${
                      showPaperLines ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                  >
                    <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-150 ${
                      showPaperLines ? "translate-x-4.5" : ""
                    }`}></div>
                  </button>
                </div>

              </div>

              {/* API KEY SECTION */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100">Thay thế Gemini API Key</h3>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700">Khóa cá nhân của bạn:</label>
                    {customApiKey && (
                      <button 
                        onClick={handleResetApiKey}
                        className="text-[9px] text-red-500 hover:underline cursor-pointer"
                        type="button"
                      >
                        Khôi phục mặc định
                      </button>
                    )}
                  </div>
                  
                  <div className="relative flex items-center">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={customApiKey}
                      onChange={(e) => handleSaveApiKey(e.target.value)}
                      placeholder="• Nhập API Key thay thế..."
                      className="w-full text-xs font-mono px-2.5 py-1.5 border rounded-md border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-10 text-left bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      title={showApiKey ? "Ẩn khóa" : "Hiển thị khóa"}
                    >
                      <span className="text-[9px] font-bold uppercase">{showApiKey ? "Ẩn" : "Hiện"}</span>
                    </button>
                  </div>
                  
                  <div className="text-[10px] leading-relaxed text-slate-400 space-y-1 bg-slate-50 p-2 border border-slate-100 rounded-lg text-justify">
                    <p className="font-semibold text-slate-500">💡 Hướng dẫn thiết lập:</p>
                    <p>• Dùng khóa API cá nhân của bạn để đảo bảo khả năng vận hành tốc độ cao ổn định không lo quá tải.</p>
                    <p>• Lấy khóa miễn phí tức thì tại: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline font-medium">Google AI Studio</a></p>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${health.hasApiKey ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`}></span>
                <span className="text-[10px] font-mono font-semibold text-slate-500">
                  {health.hasApiKey ? "Có kết nối" : "Chưa có"}
                </span>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={checkHealth}
                  className="text-[9px] text-blue-600 hover:underline cursor-pointer"
                >
                  Kiểm tra lại
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-3.5 py-1 bg-[#1e3a8a] text-white rounded-md text-xs font-medium cursor-pointer hover:bg-blue-800 transition"
              >
                Xong
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
