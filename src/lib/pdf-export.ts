import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

/**
 * Renders HTML string into a hidden iframe, captures it as canvas, and generates a downloadable PDF.
 * Works entirely client-side — no backend dependency.
 */
export async function downloadReportAsPDF(htmlContent: string, filename: string = 'relatorio.pdf'): Promise<void> {
    // Create hidden container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.background = 'white';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
        // Wait for rendering
        await new Promise(resolve => setTimeout(resolve, 300));

        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;

        // Handle multi-page if content is tall
        const totalPages = Math.ceil((imgHeight * ratio) / pdfHeight);

        for (let page = 0; page < totalPages; page++) {
            if (page > 0) pdf.addPage();
            pdf.addImage(imgData, 'PNG', imgX, -(page * pdfHeight), imgWidth * ratio, imgHeight * ratio);
        }

        pdf.save(filename);
    } finally {
        document.body.removeChild(container);
    }
}
