"use client";

import React, { useState } from "react";
import Image from "next/image";
import logo from "../../public/logoformapet.jpg";
import { Pencil, Trash2, Plus, ScrollText } from "lucide-react";
import { PDFDocument, PDFFont, StandardFonts } from "pdf-lib";

export default function Home() {
  const [formData, setFormData] = useState({
    ownerName: "",
    ownerAddress: "",
    caregiverName: "TALITA SOBRENOME SOBRENOME",
    caregiverAddress: "Rua 0, Bairro X",
    startDate: "",
    endDate: "",
    fee: "",
    currency: "R$",
  });

  const [clauses, setClauses] = useState([
    "O presente contrato tem como objeto a prestação de serviços de cuidado de pets durante o período de ${startDate} até ${endDate}.",
    "O valor total pelos serviços prestados será de ${currency} ${fee} , pagos diretamente ao(à) cuidador(a).",
    "O(a) cuidador(a) compromete-se a cuidar do(s) pet(s) com zelo, seguindo as orientações do(a) contratante, incluindo alimentação, higiene e eventuais medicações.",
    "Ambas as partes assumem responsabilidade pelas informações prestadas e declaram ciência sobre os termos deste contrato.",
  ]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newClause, setNewClause] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClause = (index: number) => {
    setEditingIndex(index);
    setNewClause(clauses[index]);
  };

  const handleSaveClause = () => {
    if (editingIndex !== null) {
      const updated = [...clauses];
      updated[editingIndex] = newClause;
      setClauses(updated);
      setEditingIndex(null);
      setNewClause("");
    }
  };

  const handleDeleteClause = (index: number) => {
    setClauses(clauses.filter((_, i) => i !== index));
  };

  const handleAddClause = () => {
    if (newClause.trim()) {
      setClauses([...clauses, newClause]);
      setNewClause("");
    }
  };

  const generateContractText = () => {
    const date = new Date().toLocaleDateString();

    const replacedClauses = clauses
      .map(
        (c, i) =>
          `CLÁUSULA ${i + 1}ª – ${c.replace(
            /\${(\w+)}/g,
            (_, key) => formData[key as keyof typeof formData] || ""
          )}`
      )
      .join("\n\n");

    return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CUIDADOR(A) DE PETS
  
CONTRATANTE: ${formData.ownerName}, residente à ${formData.ownerAddress}.

CONTRATADO(A): ${formData.caregiverName}, residente à ${formData.caregiverAddress}.

${replacedClauses}

E por estarem justos e contratados, firmam o presente instrumento.

____________________________________
${formData.ownerName} – CONTRATANTE

____________________________________
${formData.caregiverName} – CONTRATADO(A)

Data: ${date}`;
  };

  const handleGeneratePdf = async () => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const pageSize: [number, number] = [595, 842]; // A4
    const margin = 50;
    const fontSize = 12;
    const lineHeight = 18;
    const maxWidth = pageSize[0] - margin * 2;

    let page = pdfDoc.addPage(pageSize);
    let y = page.getHeight() - margin;

    const contractText = generateContractText();
    const lines = contractText.split("\n");

    const wrapText = (text: string, font: PDFFont, fontSize: number, maxWidth: number) => {
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    for (const line of lines) {
      if (line.trim() === "") {
        y -= lineHeight;
        continue;
      }

      const wrappedLines = wrapText(line, font, fontSize, maxWidth);
      for (const wrappedLine of wrappedLines) {
        if (y < margin + lineHeight) {
          page = pdfDoc.addPage(pageSize);
          y = page.getHeight() - margin;
        }

        page.drawText(wrappedLine, { x: margin, y, size: fontSize, font });
        y -= lineHeight;
      }
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Contrato_Cuidadora_Pets.pdf";
    link.click();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-white shadow px-10 py-6 flex items-center justify-between">
        <Image
          src={logo}
          alt="Logo"
          width={100}
          height={100}
        />
        <h1 className="text-2xl font-bold text-[#009ca6]">FormaPet - Talita</h1>
      </header>

      <div className="flex items-start px-20 my-10">
        <h1 className="text-2xl font-bold text-[#3c0a4a]">Elaborador de Contratos</h1>
        <ScrollText className="ml-2 text-[#803d7c]" />
      </div>

      <div className="min-h-screen bg-gray-100 px-[10vw] py-4 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col">
          <h2 className="text-xl font-bold mb-4 text-[#009ca6]">Dados do Contrato</h2>
          <div className="space-y-3">
            {[
              { label: "Nome do Contratante", name: "ownerName" },
              { label: "Endereço do Contratante", name: "ownerAddress" },
              { label: "Nome do Cuidador(a)", name: "caregiverName" },
              { label: "Endereço do Cuidador(a)", name: "caregiverAddress" },
              { label: "Data de Início", name: "startDate", type: "date" },
              { label: "Data de Fim", name: "endDate", type: "date" },
              { label: "Valor do Serviço", name: "fee" },
            ].map(({ label, name, type = "text" }) => (
              <div key={name}>
                <label className="block text-md text-[#3c0a4a] font-medium">{label}</label>
                <input
                  type={type}
                  name={name}
                  value={formData[name as keyof typeof formData]}
                  onChange={handleInputChange}
                  className="w-full p-2 mt-1 border border-[#009ca6] rounded-md focus:outline-none focus:ring-2 focus:ring-[#803d7c]"
                />
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-2 text-[#009ca6]">Cláusulas</h3>
          {clauses.map((clause, index) => (
            <div key={index} className="flex items-start gap-2 mb-2">
              {editingIndex === index ? (
                <>
                  <textarea
                    className="w-full p-2 border border-[#009ca6] rounded-md focus:ring-[#803d7c]"
                    value={newClause}
                    onChange={(e) => setNewClause(e.target.value)}
                  />
                  <button onClick={handleSaveClause} className="text-md text-[#803d7c] font-medium">Salvar</button>
                </>
              ) : (
                <>
                  <p className="flex-1 bg-gray-200 p-2 text-md">{clause}</p>
                  <button onClick={() => handleEditClause(index)}>
                    <Pencil className="w-4 h-4 text-[#803d7c]" />
                  </button>
                  <button onClick={() => handleDeleteClause(index)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </>
              )}
            </div>
          ))}

          <div className="flex gap-2 mb-2 mt-3">
            <input
              className="flex-1 p-2 border border-[#009ca6] rounded-md focus:ring-[#803d7c]"
              placeholder="Nova cláusula"
              value={newClause}
              onChange={(e) => setNewClause(e.target.value)}
            />
            <button
              onClick={handleAddClause}
              className="bg-[#009ca6] text-white p-2 rounded-md hover:bg-[#3c0a4a]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleGeneratePdf}
            className="bg-[#3c0a4a] text-white cursor-pointer mt-6 max-w-md p-3 rounded-md hover:bg-[#803d7c]"
          >
            Baixar PDF
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl max-w-1xl shadow-lg overflow-auto h-full">
          <h2 className="text-xl font-bold text-center mb-4 text-[#3c0a4a]">Prévia do Contrato</h2>
          <pre className="whitespace-pre-wrap text-md">{generateContractText()}</pre>
        </div>
      </div>

      <footer className="bg-[#803d7c] text-white text-center text-md py-3 mt-4">
        © {new Date().getFullYear()} FormaPet. Todos os direitos reservados.
      </footer>
    </div>
  );

}
