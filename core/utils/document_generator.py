"""
Document generation utilities for PDF reports, invoices, labels, etc.
Uses ReportLab for PDF generation
"""
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime
from django.conf import settings
import os
import logging

logger = logging.getLogger(__name__)


class DocumentGenerator:
    """Generate various PDF documents"""

    @staticmethod
    def generate_invoice(order, output_path: str = None) -> BytesIO:
        """
        Generate invoice PDF for an order

        Args:
            order: Order object
            output_path: Optional file path to save PDF

        Returns:
            BytesIO buffer containing the PDF
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a56db'),
            spaceAfter=30,
        )
        story.append(Paragraph("INVOICE", title_style))
        story.append(Spacer(1, 0.2 * inch))

        # Company Info (from settings or hardcoded)
        company_info = [
            ["Company Name:", settings.COMPANY_NAME if hasattr(settings, 'COMPANY_NAME') else "LogiSys Pro"],
            ["Address:", settings.COMPANY_ADDRESS if hasattr(settings, 'COMPANY_ADDRESS') else "123 Main St"],
            ["Phone:", settings.COMPANY_PHONE if hasattr(settings, 'COMPANY_PHONE') else "(555) 123-4567"],
            ["Email:", settings.COMPANY_EMAIL if hasattr(settings, 'COMPANY_EMAIL') else "info@logisyspro.com"],
        ]
        company_table = Table(company_info, colWidths=[1.5 * inch, 3 * inch])
        company_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.grey),
        ]))
        story.append(company_table)
        story.append(Spacer(1, 0.3 * inch))

        # Invoice and Customer Info
        info_data = [
            ["Invoice Number:", order.order_number, "Customer:", order.customer.name],
            ["Invoice Date:", order.order_date.strftime('%Y-%m-%d'), "Email:", order.customer.email],
            ["Status:", order.get_status_display(), "Phone:", order.customer.phone],
        ]
        info_table = Table(info_data, colWidths=[1.2 * inch, 2 * inch, 1 * inch, 2.3 * inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#374151')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#374151')),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 0.5 * inch))

        # Items Table
        items_data = [['Item', 'SKU', 'Quantity', 'Unit Price', 'Total']]

        for item in order.items.all():
            items_data.append([
                item.product.name,
                item.product.sku,
                str(item.quantity),
                f"${item.unit_price:.2f}",
                f"${item.line_total:.2f}"
            ])

        items_table = Table(items_data, colWidths=[2.5 * inch, 1.5 * inch, 1 * inch, 1 * inch, 1 * inch])
        items_table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a56db')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),

            # Body
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
            ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 0.3 * inch))

        # Totals
        totals_data = [
            ['Subtotal:', f"${order.subtotal:.2f}"],
            ['Tax:', '$0.00'],  # Add tax logic if needed
            ['Shipping:', '$0.00'],  # Add shipping logic if needed
            ['Total:', f"${order.total_amount:.2f}"],
        ]
        totals_table = Table(totals_data, colWidths=[5.5 * inch, 1.5 * inch])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (0, -2), 'Helvetica'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#1a56db')),
            ('TOPPADDING', (0, -1), (-1, -1), 10),
        ]))
        story.append(totals_table)
        story.append(Spacer(1, 0.5 * inch))

        # Footer
        footer_text = "Thank you for your business!"
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.grey,
            alignment=1,  # Center
        )
        story.append(Paragraph(footer_text, footer_style))

        # Build PDF
        doc.build(story)

        # Save to file if path provided
        if output_path:
            with open(output_path, 'wb') as f:
                f.write(buffer.getvalue())

        buffer.seek(0)
        logger.info(f"Invoice generated for order {order.order_number}")
        return buffer

    @staticmethod
    def generate_packing_slip(order, output_path: str = None) -> BytesIO:
        """
        Generate packing slip PDF for an order

        Args:
            order: Order object
            output_path: Optional file path to save PDF

        Returns:
            BytesIO buffer containing the PDF
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#059669'),
            spaceAfter=30,
        )
        story.append(Paragraph("PACKING SLIP", title_style))
        story.append(Spacer(1, 0.2 * inch))

        # Order Info
        info_data = [
            ["Order Number:", order.order_number],
            ["Order Date:", order.order_date.strftime('%Y-%m-%d')],
            ["Customer:", order.customer.name],
            ["Warehouse:", order.source_warehouse.name if order.source_warehouse else "N/A"],
        ]
        info_table = Table(info_data, colWidths=[2 * inch, 4 * inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 0.3 * inch))

        # Shipping Address
        story.append(Paragraph("<b>Ship To:</b>", styles['Heading3']))
        address_lines = [
            order.customer.name,
            order.delivery_address,
            f"{order.delivery_city}",
        ]
        for line in address_lines:
            story.append(Paragraph(line, styles['Normal']))
        story.append(Spacer(1, 0.3 * inch))

        # Items Table
        items_data = [['Item', 'SKU', 'Quantity', 'Location', 'Picked']]

        for item in order.items.all():
            items_data.append([
                item.product.name,
                item.product.sku,
                str(item.quantity),
                '',  # Location can be added if available
                '☐',  # Checkbox
            ])

        items_table = Table(items_data, colWidths=[2.5 * inch, 1.5 * inch, 1 * inch, 1.5 * inch, 0.5 * inch])
        items_table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),

            # Body
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 0.5 * inch))

        # Signatures
        sig_data = [
            ['Picked By:', '_' * 30, 'Date:', '_' * 20],
            ['Packed By:', '_' * 30, 'Date:', '_' * 20],
            ['Quality Check:', '_' * 30, 'Date:', '_' * 20],
        ]
        sig_table = Table(sig_data, colWidths=[1.2 * inch, 2.5 * inch, 0.8 * inch, 2 * inch])
        sig_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(sig_table)

        # Build PDF
        doc.build(story)

        if output_path:
            with open(output_path, 'wb') as f:
                f.write(buffer.getvalue())

        buffer.seek(0)
        logger.info(f"Packing slip generated for order {order.order_number}")
        return buffer

    @staticmethod
    def generate_shipping_label(shipment, output_path: str = None) -> BytesIO:
        """
        Generate shipping label PDF for a shipment

        Args:
            shipment: Shipment object
            output_path: Optional file path to save PDF

        Returns:
            BytesIO buffer containing the PDF
        """
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=(4 * inch, 6 * inch))

        # Tracking Number (large)
        c.setFont("Helvetica-Bold", 24)
        c.drawString(0.3 * inch, 5.3 * inch, "Tracking Number:")
        c.setFont("Helvetica-Bold", 20)
        c.drawString(0.3 * inch, 4.9 * inch, shipment.tracking_number)

        # From Address
        c.setFont("Helvetica-Bold", 12)
        c.drawString(0.3 * inch, 4.4 * inch, "FROM:")
        c.setFont("Helvetica", 10)
        if shipment.pickup_warehouse:
            c.drawString(0.3 * inch, 4.2 * inch, shipment.pickup_warehouse.name)
            c.drawString(0.3 * inch, 4.0 * inch, shipment.pickup_warehouse.address)
            c.drawString(0.3 * inch, 3.8 * inch, f"{shipment.pickup_warehouse.city}, {shipment.pickup_warehouse.country}")

        # To Address (prominent)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(0.3 * inch, 3.2 * inch, "SHIP TO:")
        c.setFont("Helvetica-Bold", 11)

        # Get first order for delivery address
        if shipment.orders.exists():
            order = shipment.orders.first()
            y_pos = 2.9 * inch
            c.drawString(0.3 * inch, y_pos, order.customer.name)
            y_pos -= 0.2 * inch
            c.setFont("Helvetica", 10)
            c.drawString(0.3 * inch, y_pos, order.delivery_address)
            y_pos -= 0.2 * inch
            c.drawString(0.3 * inch, y_pos, order.delivery_city)

        # Date and service info
        c.setFont("Helvetica", 9)
        c.drawString(0.3 * inch, 1.5 * inch, f"Ship Date: {datetime.now().strftime('%Y-%m-%d')}")
        c.drawString(0.3 * inch, 1.3 * inch, f"Service: Standard")

        # Driver info
        if shipment.driver:
            c.drawString(0.3 * inch, 1.0 * inch, f"Driver: {shipment.driver.user.get_full_name()}")

        # Border
        c.setStrokeColor(colors.black)
        c.setLineWidth(2)
        c.rect(0.2 * inch, 0.2 * inch, 3.6 * inch, 5.6 * inch)

        c.save()

        if output_path:
            with open(output_path, 'wb') as f:
                f.write(buffer.getvalue())

        buffer.seek(0)
        logger.info(f"Shipping label generated for shipment {shipment.tracking_number}")
        return buffer

    @staticmethod
    def generate_delivery_manifest(shipment, output_path: str = None) -> BytesIO:
        """
        Generate delivery manifest PDF for a shipment

        Args:
            shipment: Shipment object
            output_path: Optional file path to save PDF

        Returns:
            BytesIO buffer containing the PDF
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#7c3aed'),
            spaceAfter=30,
        )
        story.append(Paragraph("DELIVERY MANIFEST", title_style))
        story.append(Spacer(1, 0.2 * inch))

        # Shipment Info
        info_data = [
            ["Tracking Number:", shipment.tracking_number],
            ["Shipment Date:", shipment.shipment_date.strftime('%Y-%m-%d')],
            ["Driver:", shipment.driver.user.get_full_name() if shipment.driver else "N/A"],
            ["Vehicle:", f"{shipment.vehicle.make} {shipment.vehicle.model}" if shipment.vehicle else "N/A"],
            ["Status:", shipment.get_status_display()],
        ]
        info_table = Table(info_data, colWidths=[2 * inch, 4 * inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 0.3 * inch))

        # Orders Table
        orders_data = [['Order #', 'Customer', 'Delivery Address', 'Items', 'Signature']]

        for order in shipment.orders.all():
            orders_data.append([
                order.order_number,
                order.customer.name,
                f"{order.delivery_address}, {order.delivery_city}",
                str(order.items.count()),
                '',
            ])

        orders_table = Table(orders_data, colWidths=[1.3 * inch, 1.5 * inch, 2.5 * inch, 0.7 * inch, 1 * inch])
        orders_table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7c3aed')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),

            # Body
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(orders_table)

        # Build PDF
        doc.build(story)

        if output_path:
            with open(output_path, 'wb') as f:
                f.write(buffer.getvalue())

        buffer.seek(0)
        logger.info(f"Delivery manifest generated for shipment {shipment.tracking_number}")
        return buffer
