'use client';

import { CatalogWine } from '@/types';

interface TechSheetButtonProps {
  wine: CatalogWine;
}

export function TechSheetButton({ wine }: TechSheetButtonProps) {
  async function handleDownload() {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(139, 69, 19); // #8B4513 terracotta
    doc.text('CHAUSSE SELECTIONS', 20, 22);

    doc.setFontSize(10);
    doc.setTextColor(120, 113, 108); // muted
    doc.setFont('helvetica', 'normal');
    doc.text('Trade Portfolio', 20, 30);

    // Divider
    doc.setDrawColor(184, 150, 62); // gold
    doc.setLineWidth(0.5);
    doc.line(20, 34, 190, 34);

    // Wine name + producer
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(28, 25, 23); // #1C1917
    const displayName = wine.name || wine.fullName;
    const titleLines = doc.splitTextToSize(displayName, 170) as string[];
    doc.text(titleLines, 20, 44);
    const titleHeight = titleLines.length * 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(68, 64, 60);
    doc.text(wine.producer, 20, 44 + titleHeight);

    // Specs table
    const specsData: [string, string][] = [
      ['Type', wine.wineType],
      ['Vintage', wine.vintage || 'N/A'],
      ['Varietal', wine.varietal || 'N/A'],
      ['Country', wine.country || 'N/A'],
      ['Region', wine.region || 'N/A'],
      ['Bottle Price', wine.bottlePrice > 0 ? `$${wine.bottlePrice.toFixed(2)}` : 'Contact for pricing'],
      ['Natural', wine.isNatural ? 'Yes' : 'No'],
      ['Biodynamic', wine.isBiodynamic ? 'Yes' : 'No'],
      ['Direct Import', wine.isDirect ? 'Yes' : 'No'],
    ];

    autoTable(doc, {
      startY: 44 + titleHeight + 14,
      head: [['Specification', 'Detail']],
      body: specsData,
      theme: 'grid',
      headStyles: {
        fillColor: [139, 69, 19],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [28, 25, 23],
      },
      alternateRowStyles: {
        fillColor: [250, 250, 247],
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 120 },
      },
      margin: { left: 20, right: 20 },
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(120, 113, 108);
    doc.text('Chausse Selections · Trade use only', 20, pageHeight - 12);
    doc.text(`Generated ${new Date().toLocaleDateString()}`, 190, pageHeight - 12, { align: 'right' });

    doc.save(`${wine.code}-tech-sheet.pdf`);
  }

  return (
    <button
      onClick={handleDownload}
      style={{
        padding: '0.6rem 1.25rem',
        backgroundColor: '#8B4513',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '0.9rem',
        fontWeight: 600,
        cursor: 'pointer',
        letterSpacing: '0.02em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'background-color 0.15s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#7A3B10')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#8B4513')}
    >
      Download Tech Sheet
    </button>
  );
}
