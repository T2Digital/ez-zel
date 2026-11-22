import{e as M,f as v,n as E,a as o,k as q,i as D,j as F,g as W,b as _,h as H}from"./index-DOz6BjLg.js";import"./vendor-react-oUE3SYY_.js";import"./vendor-firebase-BovmBOU-.js";const j={main:"المخزن",branch1:"الرئيسي",branch2:"فرع 1",branch3:"فرع 2"},O={main:"79 شارع رمسيس ناصية التوفيقية امام سنترال رمسيس",branch1:"79 شارع رمسيس ناصية التوفيقية امام سنترال رمسيس",branch2:"1 شارع البورصة ناصية التوفيقية امام دار القضاء العالى",branch3:"19 شارع رمسيس ناصية التوفيقية امام سنترال رمسيس"},I=t=>`
<style>
    body { 
        font-family: 'Cairo', Arial, sans-serif; 
        direction: rtl; 
        margin: 20px;
        color: #333;
        line-height: 1.6;
        background-color: #f9fafb;
    }
    .header { 
        text-align: center; 
        margin-bottom: 30px; 
        border-bottom: 3px solid ${t};
        padding-bottom: 20px;
    }
    .header h1 { 
        color: ${t}; 
        margin-bottom: 10px;
        font-size: 28px;
    }
    .header h2 { 
        color: #4b5563; 
        margin-bottom: 5px;
        font-size: 20px;
    }
    .sub-header {
        font-size: 18px;
        font-weight: bold;
        color: #1f2937;
        margin-top: 30px;
        margin-bottom: 15px;
        border-bottom: 1px solid #d1d5db;
        padding-bottom: 5px;
    }
    .summary {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 30px;
        border-right: 4px solid ${t};
    }
    .summary h3 {
        color: ${t};
        margin-bottom: 15px;
        font-size: 18px;
    }
    .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 15px;
    }
    .summary-item {
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        border: 1px solid #e5e7eb;
    }
    .summary-item p {
        margin: 0 0 5px 0;
        font-size: 14px;
        color: #6b7280;
    }
    .summary-item strong {
        color: ${t};
        font-size: 20px;
    }
    table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 25px 0;
        background: white;
        box-shadow: 0 4px 15px rgba(0,0,0,0.07);
        border-radius: 10px;
        overflow: hidden;
    }
    th, td { 
        border: 1px solid #e5e7eb; 
        padding: 12px 15px; 
        text-align: right; 
    }
    th { 
        background-color: ${t};
        color: white;
        font-weight: 600;
        font-size: 14px;
        text-transform: uppercase;
    }
    tbody tr:nth-child(even) {
        background-color: #f8f9fa;
    }
    tbody tr:hover {
        background-color: #f1f5f9;
    }
    .total-row {
        font-weight: bold;
        background-color: #e5e7eb !important;
        color: #1f2937;
        font-size: 16px;
    }
    .badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 99px;
        font-size: 12px;
        font-weight: 500;
        color: white;
    }
    .badge-paid { background: #10b981; }
    .badge-pending { background: #ef4444; }
    .footer {
        margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px;
    }
    @media print {
        body { margin: 0; background-color: white; }
        .no-print { display: none; }
        .summary, table { box-shadow: none; border: 1px solid #ddd; }
    }
</style>
`,N=(t,h,r,a=!1)=>`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>${t}</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    ${I(h)}
    ${a?`
    <style>
        @page { margin: 0; }
        body { margin: 0; padding: 0; background: #fff; width: 72mm; max-width: 72mm; margin: 0 auto; font-family: 'Cairo', sans-serif; font-size: 12px; color: #000; direction: rtl; }
        .invoice-box { width: 100%; margin: 0; padding: 0 2mm; box-sizing: border-box; overflow: hidden; }
        .invoice-box table { width: 100%; line-height: 1.2; text-align: right; border-collapse: collapse; }
        .invoice-box table td { padding: 2px 0; vertical-align: top; font-size: 12px; word-wrap: break-word; }
        .invoice-box table tr.top table td { padding-bottom: 5px; text-align: center; }
        .invoice-box table tr.top table td.title { font-size: 20px; line-height: 24px; color: #000; font-weight: bold; }
        .invoice-box table tr.information table td { padding-bottom: 10px; text-align: center; border-bottom: 1px dashed #000; }
        .invoice-box table tr.heading td { background: transparent; border-bottom: 1px dashed #000; font-weight: bold; padding: 5px 0; }
        .invoice-box table tr.details td { padding-bottom: 5px; }
        .invoice-box table tr.item td { border-bottom: 1px dotted #ccc; padding: 4px 0; }
        .invoice-box table tr.item.last td { border-bottom: 1px dashed #000; }
        .invoice-box table tr.total td { font-weight: bold; padding-top: 5px; font-size: 14px; }
        .invoice-box .text-center { text-align: center; }
        .invoice-box .text-left { text-align: left; }
        .invoice-box .mb-2 { margin-bottom: 5px; }
        .invoice-box .mt-4 { margin-top: 10px; }
        .invoice-box hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
        @media print {
            @page { margin: 0; }
            body { width: 72mm; max-width: 72mm; margin: 0 auto; padding: 0; }
            .invoice-box { padding: 2mm; padding-bottom: 30mm !important; width: 100%; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid; }
            .page-break { page-break-after: always; break-after: page; display: block; height: 1px; background: transparent; border: none; clear: both; }
            .no-print { display: none; }
        }
    </style>
    `:""}
</head>
<body>
    ${r}
    ${a?`
    <script>
        // Parent tab will manually print iframes to ensure separate print queue jobs
    <\/script>
    `:`
    <div class="no-print" style="text-align: left; margin: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: ${h}; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-family: 'Cairo', sans-serif;">طباعة التقرير</button>
    </div>
    `}
</body>
</html>`,B=(t,h,r)=>{const a=(r==null?void 0:r.isTaxable)||!1,n=(r==null?void 0:r.copyType)||"both",b=x=>{var T;return x.productName||((T=h.find(R=>R.id===x.productId))==null?void 0:T.name)||"صنف غير معروف"},p=E(t),g=p.map(x=>{const T=x.serialNumbers&&x.serialNumbers.length>0?`<div style="font-size: 10px; color: #666; margin-top: 2px;">S/N: ${x.serialNumbers.join(", ")}</div>`:"";return`
        <tr class="item">
            <td>
                ${b(x)}
                ${T}
            </td>
            <td style="text-align:center;">${x.quantity}</td>
            <td style="text-align:center;">${o(x.unitPrice)}</td>
            <td style="text-align:left;">${o(x.quantity*x.unitPrice)}</td>
        </tr>
    `}).join(""),i=typeof window<"u"&&window.__TENANT_STOREFRONT_SETTINGS__||{},s=typeof window<"u"&&window.__TENANT_BRAND__||{},c=W(i,(s==null?void 0:s.name)||"المتجر الإلكتروني"),d=_((s==null?void 0:s.appCustomization)||null),m=H(t.branchSoldFrom,d),y=c.address||O[t.branchSoldFrom]||O.main,w=c.contactPhone||(s==null?void 0:s.phone)||"01013373634",A=`
        <p style="margin: 0; font-size: 10px;">${y}</p>
        ${`<p style="margin: 0; font-size: 10px;">تليفون: ${w}</p>`}
        ${c.commercialRegister?`<p style="margin: 1px 0 0 0; font-size: 10px; font-weight: 600;">سجل تجاري: ${c.commercialRegister}</p>`:""}
        ${c.taxCardNumber?`<p style="margin: 1px 0 0 0; font-size: 10px; font-weight: 600;">بطاقة ضريبية: ${c.taxCardNumber}</p>`:""}
    `,z=p.reduce((x,T)=>{const R=T.quantity*T.unitPrice;return T.isReturn?x-R:x+R},0),e=t.discount||0,u=Number(t.discountAmount||0),f=typeof t.deliveryFee=="number"?Math.max(0,t.deliveryFee):t.source==="أونلاين"&&!t.isTaxable&&t.totalAmount>z-u?Math.max(0,Math.round(t.totalAmount-(z-u))):void 0,P=t.source==="أونلاين"||f!==void 0&&f>0;let l=Math.round(t.totalAmount),S=0,$=Math.round(t.totalAmount);a?t.isTaxable?($=Math.round(t.totalAmount),l=Math.round(t.totalAmount/1.14),S=Math.round(t.totalAmount-l)):(l=Math.round(t.totalAmount),S=Math.round(l*.14),$=Math.round(l+S)):t.isTaxable?l=Math.round(t.totalAmount/1.14):l=Math.round(t.totalAmount);const k=x=>`
    <div class="invoice-box">
        <div class="text-center mb-2">
            <h1 style="margin: 0; font-size: 18px; font-weight: bold;">${c.companyName}</h1>
            ${c.slogan?`<p style="margin: 0; font-size: 11px;">${c.slogan}</p>`:""}
            ${a?`
                <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; color: #000;">فاتورة ضريبية</p>
            `:""}
            ${A}
        </div>
        <hr>
        <div style="font-size: 12px; margin-bottom: 5px;">
            <div><strong>نوع الفاتورة:</strong> <span style="font-weight: bold; ${t.direction==="مرتجع"?"color: #ef4444; font-size: 14px;":""}">${t.direction==="مرتجع"?"مرتجع 🔴":t.direction==="بيع"?"بيع":t.direction==="تبديل"?"تبديل":t.direction}</span></div>
            ${t.direction==="مرتجع"&&t.notes?`<div style="color: #ef4444; margin-bottom: 4px;"><strong>سبب المرتجع:</strong> ${t.notes}</div>`:""}
            <div><strong>رقم الفاتورة:</strong> ${t.invoiceNumber}</div>
            <div><strong>التاريخ والوقت:</strong> ${q(t.date,t.timestamp)}</div>
            <div><strong>الفرع:</strong> ${m}</div>
            <div><strong>البائع:</strong> ${t.sellerName}</div>
            ${t.customerName?`<div><strong>العميل:</strong> ${t.customerName}</div>`:""}
            ${t.customerPhone?`<div><strong>تليفون العميل:</strong> ${t.customerPhone}</div>`:""}
            ${t.customerAddress?`<div><strong>العنوان:</strong> ${t.customerAddress}</div>`:""}
            ${t.warrantyPeriod?`<div><strong>الضمان:</strong> ${t.warrantyPeriod}</div>`:""}
        </div>
        <hr>
        <table cellpadding="0" cellspacing="0" style="table-layout: fixed; width: 100%; word-wrap: break-word;">
            <tr class="heading">
                <td style="width: 40%;">الصنف</td>
                <td style="text-align:center; width: 15%;">الكمية</td>
                <td style="text-align:center; width: 20%;">السعر</td>
                <td style="text-align:left; width: 25%;">الإجمالي</td>
            </tr>
            ${g}
        </table>
        <hr>
        <table cellpadding="0" cellspacing="0" style="table-layout: fixed; width: 100%; word-wrap: break-word;">
            <tr class="total">
                <td colspan="3" style="text-align:right;">المجموع:</td>
                <td style="text-align:left;">${o(z)}</td>
            </tr>
            ${e?`
            <tr>
                <td colspan="3" style="text-align:right; font-size: 10px;">خصم (${e}%):</td>
                <td style="text-align:left; font-size: 10px;">-${o(z*(e/100))}</td>
            </tr>
            `:""}
            ${u>0?`
            <tr>
                <td colspan="3" style="text-align:right; font-size: 10px;">الخصم:</td>
                <td style="text-align:left; font-size: 10px;">-${o(u)}</td>
            </tr>
            `:""}
            ${P?`
            <tr>
                <td colspan="3" style="text-align:right; font-size: 11px; font-weight: 600;">تكلفة الشحن${t.shippingZone?` (${t.shippingZone})`:""}:</td>
                <td style="text-align:left; font-size: 11px; font-weight: 600;">${f&&f>0?o(f):"مجاني"}</td>
            </tr>
            `:""}
            ${a?`
            <tr>
                <td colspan="3" style="text-align:right; font-size: 10px;">الإجمالي قبل الضريبة:</td>
                <td style="text-align:left; font-size: 10px;">${o(l)}</td>
            </tr>
            <tr>
                <td colspan="3" style="text-align:right; font-size: 10px; font-weight: bold;">ضريبة القيمة المضافة (14%):</td>
                <td style="text-align:left; font-size: 10px; font-weight: bold;">${o(S)}</td>
            </tr>
            <tr class="total" style="border-top: 1px dashed #000;">
                <td colspan="3" style="text-align:right; font-size: 13px; font-weight: bold;">الإجمالي شامل الضريبة:</td>
                <td style="text-align:left; font-size: 13px; font-weight: bold;">${o($)}</td>
            </tr>
            `:`
            <tr class="total" style="border-top: 1px dashed #000;">
                <td colspan="3" style="text-align:right; font-size: 13px; font-weight: bold;">الإجمالي النهائي:</td>
                <td style="text-align:left; font-size: 13px; font-weight: bold;">${o(l)}</td>
            </tr>
            `}
            ${t.paymentMethod?`
            <tr>
                <td colspan="3" style="text-align:right; font-size: 10px;">طريقة الدفع:</td>
                <td style="text-align:left; font-size: 10px;">${t.paymentMethod}</td>
            </tr>
            `:""}
            ${t.cashAmount?`
            <tr>
                <td colspan="3" style="text-align:right; font-size: 10px;">المدفوع نقداً:</td>
                <td style="text-align:left; font-size: 10px;">${o(t.cashAmount)}</td>
            </tr>
            `:""}
            ${t.electronicAmount?`
            <tr>
                <td colspan="3" style="text-align:right; font-size: 10px;">المدفوع إلكترونياً:</td>
                <td style="text-align:left; font-size: 10px;">${o(t.electronicAmount)}</td>
            </tr>
            `:""}
            ${t.remainingDebt?`
            <tr>
                <td colspan="3" style="text-align:right; font-size: 10px; font-weight: bold;">المتبقي (آجل):</td>
                <td style="text-align:left; font-size: 10px; font-weight: bold;">${o(t.remainingDebt)}</td>
            </tr>
            `:""}
        </table>
        ${t.notes?`
        <hr>
        <div style="font-size: 10px; text-align: center;">
            <strong>ملاحظات:</strong> ${t.notes}
        </div>
        `:""}
        <hr>
        <div class="text-center mt-4" style="font-size: 10px;">
            <p style="margin: 0; font-weight: bold;">شكراً لتعاملكم معنا!</p>
            <div style="text-align: right; margin-top: 5px;">
                <strong>سياسة الاستبدال والاسترجاع:</strong>
                <ul style="margin: 2px 15px 0 0; padding: 0;">
                    <li>متاح خلال 14 يوم من تاريخ الشراء.</li>
                    <li>الأسبوع الأول: إمكانية استرجاع المبلغ نقداً.</li>
                    <li>الأسبوع الثاني: استبدال بمنتج آخر فقط.</li>
                    <li>لا يمكن الاستبدال أو الاسترجاع بدون أصل الفاتورة.</li>
                    <li>يشترط الحفاظ على حالة المنتج الأصلية (الكرتونة والمحتويات).</li>
                </ul>
            </div>
            <div style="margin-top: 5px; font-size: 9px; color: #555;">${x}</div>
        </div>
        <!-- 3cm blank space for easy tearing on thermal printers -->
        <div style="height: 3cm; min-height: 30mm; width: 100%; clear: both;"></div>
    </div>
    `;let C="";return n==="customer"?C=`<div id="copy-customer" style="display: block;">${k("(نسخة العميل)")}</div>`:n==="shop"?C=`<div id="copy-shop" style="display: block;">${k("(نسخة المحل)")}</div>`:C=`
            <div id="copy-customer" style="display: block;">${k("(نسخة العميل)")}</div>
            <div id="copy-shop" style="display: none;">${k("(نسخة المحل)")}</div>
        `,N(`فاتورة ${t.invoiceNumber}`,"#3b82f6",C,!0)},V=(t,h,r=t.isTaxable||!1)=>{var d,m;const a=document.getElementById("print-iframe-customer"),n=document.getElementById("print-iframe-shop");a&&a.parentNode&&a.parentNode.removeChild(a),n&&n.parentNode&&n.parentNode.removeChild(n);const b=B(t,h,{isTaxable:r,copyType:"customer"}),p=B(t,h,{isTaxable:r,copyType:"shop"}),g=document.createElement("iframe");g.id="print-iframe-customer",g.style.position="absolute",g.style.width="0px",g.style.height="0px",g.style.border="none",g.style.left="-9999px",g.style.top="-9999px";const i=document.createElement("iframe");i.id="print-iframe-shop",i.style.position="absolute",i.style.width="0px",i.style.height="0px",i.style.border="none",i.style.left="-9999px",i.style.top="-9999px",document.body.appendChild(g),document.body.appendChild(i);const s=((d=g.contentWindow)==null?void 0:d.document)||g.contentDocument,c=((m=i.contentWindow)==null?void 0:m.document)||i.contentDocument;s&&c&&(s.open(),s.write(b),s.close(),c.open(),c.write(p),c.close(),g.contentWindow&&(g.contentWindow.onafterprint=()=>{setTimeout(()=>{i.contentWindow&&(i.contentWindow.focus(),i.contentWindow.print())},2500)}),i.contentWindow&&(i.contentWindow.onafterprint=()=>{setTimeout(()=>{const y=document.getElementById("print-iframe-customer"),w=document.getElementById("print-iframe-shop");y&&y.parentNode&&y.parentNode.removeChild(y),w&&w.parentNode&&w.parentNode.removeChild(w)},1e3)}),setTimeout(()=>{g.contentWindow&&(g.contentWindow.focus(),g.contentWindow.print())},550))},Y=t=>{const{dailySales:h=[],products:r=[]}=t,a=h.reduce((c,d)=>{const m=d.date;return c[m]||(c[m]={revenue:0,profit:0}),(d.direction==="بيع"||d.direction==="مرتجع"||d.direction==="تبديل")&&(c[m].revenue+=D(d),c[m].profit+=F(d,r)),c},{}),n=Object.keys(a).sort((c,d)=>new Date(d).getTime()-new Date(c).getTime());let b=0,p=0;const g=n.map(c=>{const{revenue:d,profit:m}=a[c],y=d-m;return b+=d,p+=y,`
            <tr>
                <td>${v(c)}</td>
                <td>${o(d)}</td>
                <td>${o(y)}</td>
                <td style="font-weight: bold; color: ${m>=0?"#10b981":"#ef4444"};">${o(m)}</td>
            </tr>
        `}).join(""),i=b-p,s=`
        <div class="header">
            <h1>شركة أوتو هاوس لقطع غيار السيارات</h1>
            <h2>تقرير المبيعات</h2>
            <p>تاريخ التقرير: ${v(new Date().toISOString())}</p>
        </div>
        <div class="summary">
            <h3>ملخص شامل</h3>
            <div class="summary-grid">
                <div class="summary-item"><p>إجمالي المبيعات</p><strong>${o(b)}</strong></div>
                <div class="summary-item"><p>إجمالي التكلفة</p><strong>${o(p)}</strong></div>
                <div class="summary-item"><p>إجمالي صافي الربح</p><strong style="color: ${i>=0?"#10b981":"#ef4444"};">${o(i)}</strong></div>
            </div>
        </div>
        <table>
            <thead><tr><th>التاريخ</th><th>إجمالي المبيعات</th><th>تكلفة البضاعة المباعة</th><th>صافي الربح</th></tr></thead>
            <tbody>
                ${g}
                <tr class="total-row">
                    <td>الإجمالي</td>
                    <td>${o(b)}</td>
                    <td>${o(p)}</td>
                    <td>${o(i)}</td>
                </tr>
            </tbody>
        </table>
        <div class="footer">
            <p>تم إنشاء هذا التقرير بواسطة نظام إدارة شركة أوتو هاوس المتكامل</p>
        </div>
    `;return N("تقرير المبيعات","#059669",s)},Z=t=>{const{employees:h}=t,r=h.reduce((n,b)=>n+b.basicSalary,0),a=`
        <div class="header">
            <h1>شركة أوتو هاوس لقطع غيار السيارات</h1>
            <h2>تقرير الموظفين</h2>
            <p>تاريخ التقرير: ${v(new Date().toISOString())}</p>
        </div>
        <div class="summary">
            <h3>ملخص الموظفين</h3>
            <div class="summary-grid">
                <div class="summary-item"><p>إجمالي الموظفين</p><strong>${h.length}</strong></div>
                <div class="summary-item"><p>إجمالي الرواتب</p><strong>${o(r)}</strong></div>
            </div>
        </div>
        <table>
            <thead><tr><th>الاسم</th><th>المنصب</th><th>الراتب</th><th>تاريخ التوظيف والوقت</th><th>الهاتف</th></tr></thead>
            <tbody>
                ${h.map(n=>`
                    <tr>
                        <td>${n.name}</td>
                        <td>${n.position}</td>
                        <td>${o(n.basicSalary)}</td>
                        <td dir="ltr">${q(n.hireDate,n.timestamp)}</td>
                        <td>${n.phone||"-"}</td>
                    </tr>`).join("")}
                <tr class="total-row">
                    <td colspan="2">الإجمالي</td>
                    <td>${o(r)}</td>
                    <td colspan="2"></td>
                </tr>
            </tbody>
        </table>
        <div class="footer">
            <p>تم إنشاء هذا التقرير بواسطة نظام إدارة شركة أوتو هاوس المتكامل</p>
        </div>
        `;return N("تقرير الموظفين","#1e40af",a)},K=t=>{const{suppliers:h,payments:r,purchaseOrders:a}=t,n=i=>{var s;return((s=h.find(c=>c.id===i))==null?void 0:s.name)||"غير معروف"},b=r.reduce((i,s)=>i+s.payment,0),p=a.filter(i=>i.status==="مكتمل").reduce((i,s)=>i+(s.type==="مرتجع"?-s.totalAmount:s.totalAmount),0),g=`
        <div class="header"><h1>شركة أوتو هاوس لقطع غيار السيارات</h1><h2>تقرير الموردين</h2><p>تاريخ التقرير: ${v(new Date().toISOString())}</p></div>
        <div class="summary"><h3>ملخص الموردين</h3><div class="summary-grid">
            <div class="summary-item"><p>إجمالي المدفوعات</p><strong>${o(b)}</strong></div>
            <div class="summary-item"><p>إجمالي الفواتير</p><strong>${o(p)}</strong></div>
        </div></div>
        <h3>الدفعات</h3>
        <table>
            <thead><tr><th>التاريخ والوقت</th><th>المورد</th><th>الدفعة</th><th>الفاتورة</th></tr></thead>
            <tbody>
                ${r.map(i=>`<tr>
                    <td dir="ltr">${q(i.date,i.timestamp)}</td>
                    <td>${n(i.supplierId)}</td>
                    <td>${o(i.payment)}</td>
                    <td>${o(i.invoiceTotal)}</td>
                </tr>`).join("")}
            </tbody>
        </table>
        <div class="footer"><p>تم إنشاء هذا التقرير بواسطة نظام إدارة شركة أوتو هاوس المتكامل</p></div>
        `;return N("تقرير الموردين","#10b981",g)},J=(t,h,r)=>{let a="يومي";r==="weekly"&&(a="أسبوعي"),r==="monthly"&&(a="شهري"),r==="yearly"&&(a="سنوي");let n=`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>تقرير المبيعات - ${a}</title>
            ${I("#10b981")}
            <style>
                @media print {
                    .no-print { display: none; }
                    body { background-color: white; }
                    table { box-shadow: none; }
                }
            </style>
        </head>
        <body>
            <div class="no-print" style="text-align: left; margin-bottom: 20px;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">طباعة التقرير</button>
            </div>
            <div class="header">
                <h1>تقرير المبيعات المفلتر</h1>
                <h2>الفترة: ${a} (${h})</h2>
                <p>تاريخ الطباعة: ${v(new Date().toISOString())}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>رقم الفاتورة</th>
                        <th>التاريخ والوقت</th>
                        <th>الفرع</th>
                        <th>البائع</th>
                        <th>النوع</th>
                        <th>المبلغ</th>
                    </tr>
                </thead>
                <tbody>
    `,b=0;return t.forEach(p=>{p.direction==="بيع"&&(b+=p.totalAmount),p.direction==="مرتجع"&&(b-=p.totalAmount),n+=`
            <tr>
                <td>${p.invoiceNumber}</td>
                <td dir="ltr">${q(p.date,p.timestamp)}</td>
                <td>${j[p.branchSoldFrom]||p.branchSoldFrom}</td>
                <td>${p.sellerName}</td>
                <td>${p.direction}</td>
                <td style="font-weight: bold; color: ${p.direction==="مرتجع"?"red":"green"};">${o(p.totalAmount)}</td>
            </tr>
        `}),n+=`
                </tbody>
            </table>
            
            <div class="summary" style="margin-top: 30px; border-right-color: #10b981;">
                <h3>ملخص المبيعات</h3>
                <div class="summary-grid">
                    <div class="summary-item">
                        <p>إجمالي العمليات</p>
                        <strong>${t.length}</strong>
                    </div>
                    <div class="summary-item">
                        <p>صافي المبيعات</p>
                        <strong style="color: ${b>=0?"#10b981":"#ef4444"};">${o(b)}</strong>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `,n},Q=(t,h,r,a)=>{const{dailySales:n,products:b,purchaseOrders:p,stockTransfers:g}=t,i=b.find(e=>e.id===h);if(!i)return N("خطأ","#ef4444","لم يتم العثور على المنتج");let s=[];n.forEach(e=>{E(e).forEach(u=>{if(u.productId===h){const f=e.direction==="مرتجع"||u.isReturn;s.push({date:e.date,timestamp:e.timestamp,type:f?"مرتجع مبيعات":"مبيعات",invoiceNumber:e.invoiceNumber,saleId:e.id,branch:e.branchSoldFrom,quantityChange:f?u.quantity:-u.quantity,notes:e.notes||"",price:u.unitPrice})}})}),p.forEach(e=>{e.status==="مكتمل"&&e.items.forEach(u=>{if(u.productId===h){const f=e.type==="مرتجع";s.push({date:e.orderDate,timestamp:e.timestamp,type:f?"مرتجع مشتريات":"مشتريات",invoiceNumber:`PO-${e.id}`,branch:"main",quantityChange:f?-u.quantity:u.quantity,notes:e.notes||"",price:u.purchasePrice})}})}),g.forEach(e=>{e.productId===h&&(s.push({date:e.date,timestamp:e.timestamp,type:"نقل مخزون (صادر)",invoiceNumber:`TR-${e.id}`,branch:e.fromBranch,quantityChange:-e.quantity,notes:`إلى ${e.toBranch} - ${e.notes||""}`,price:0}),s.push({date:e.date,timestamp:e.timestamp,type:"نقل مخزون (وارد)",invoiceNumber:`TR-${e.id}`,branch:e.toBranch,quantityChange:e.quantity,notes:`من ${e.fromBranch} - ${e.notes||""}`,price:0}))}),s.sort((e,u)=>{const f=e.timestamp?new Date(e.timestamp).getTime():new Date(e.date).getTime(),P=u.timestamp?new Date(u.timestamp).getTime():new Date(u.date).getTime();return f-P});const c=M(i);let d=0;s.forEach(e=>{d+=e.quantityChange});let m=c-d,y=[],w=m;s.forEach(e=>{const u=new Date(e.date),f=!r||u>=new Date(r),P=!a||u<=new Date(a);r&&u<new Date(r)&&(w+=e.quantityChange),m+=e.quantityChange,e.runningBalance=m,f&&P&&y.push(e)});const A=r&&a?`من ${v(r)} إلى ${v(a)}`:r?`من ${v(r)}`:a?`حتى ${v(a)}`:"كل الأوقات",z=`
        <div class="header">
            <h1>شركة أوتو هاوس لقطع غيار السيارات</h1>
            <h2>تقرير حركة صنف (كارت الصنف)</h2>
            <p>تاريخ التقرير: ${v(new Date().toISOString())}</p>
            <p>الفترة: ${A}</p>
        </div>
        <div class="summary">
            <h3>بيانات الصنف</h3>
            <div class="summary-grid">
                <div class="summary-item" style="grid-column: span 2;"><p>اسم الصنف</p><strong>${i.name}</strong></div>
                <div class="summary-item"><p>الكود (SKU)</p><strong>${i.sku}</strong></div>
                <div class="summary-item"><p>سعر البيع</p><strong>${o(i.sellingPrice)}</strong></div>
                <div class="summary-item"><p>المخزون الفعلي الحالي</p><strong class="text-blue-600">${c}</strong></div>
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>التاريخ والوقت</th>
                    <th>رقم المرجع</th>
                    <th>نوع الحركة</th>
                    <th>الفرع</th>
                    <th>الكمية</th>
                    <th>الرصيد</th>
                    <th>ملاحظات</th>
                </tr>
            </thead>
            <tbody>
                <tr class="bg-gray-100 font-bold">
                    <td colspan="5" style="text-align: right;">رصيد بداية المدة</td>
                    <td class="text-blue-600">${w}</td>
                    <td></td>
                </tr>
                ${y.length>0?y.map(e=>{const u=e.quantityChange>0?`+${e.quantityChange}`:`${e.quantityChange}`,f=e.quantityChange>0?"text-green-600":"text-red-600",P=e.saleId?`<div style="display: flex; align-items: center; justify-content: center; gap: 5px;">
                        <a href="#" onclick="if(window.opener) { try { window.opener.location.hash = 'sales?view=${e.saleId}'; window.opener.postMessage({ type: 'OPEN_INVOICE', saleId: ${e.saleId} }, '*'); window.opener.focus(); alert('تم فتح تفاصيل الفاتورة في النافذة الرئيسية للنظام.\\nيرجى الرجوع للنافذة السابقة لمشاهدتها.'); } catch(e) { console.error(e); } } else { alert('لا يمكن الوصول للنافذة الرئيسية للنظام.'); } return false;" style="color: #3b82f6; text-decoration: underline; cursor: pointer;">${e.invoiceNumber}</a>
                        <button onclick="navigator.clipboard.writeText('${e.invoiceNumber}').then(() => alert('تم نسخ رقم الفاتورة: ${e.invoiceNumber}')); return false;" style="background: none; border: none; cursor: pointer; color: #6b7280; padding: 2px;" title="نسخ رقم الفاتورة">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        </button>
                    </div>`:e.invoiceNumber;return`<tr>
                        <td dir="ltr">${q(e.date,e.timestamp)}</td>
                        <td>${P}</td>
                        <td>${e.type}</td>
                        <td>${e.branch}</td>
                        <td class="${f} font-bold" dir="ltr">${u}</td>
                        <td class="font-bold">${e.runningBalance}</td>
                        <td>${e.notes||"-"}</td>
                    </tr>`}).join(""):'<tr><td colspan="7" style="text-align: center; padding: 20px;">لا توجد حركات مسجلة لهذا الصنف في هذه الفترة.</td></tr>'}
                <tr class="bg-gray-100 font-bold">
                    <td colspan="5" style="text-align: right;">رصيد نهاية المدة</td>
                    <td class="text-blue-600">${y.length>0?y[y.length-1].runningBalance:w}</td>
                    <td></td>
                </tr>
            </tbody>
        </table>
        <div class="footer"><p>تم إنشاء هذا التقرير بواسطة نظام إدارة شركة أوتو هاوس المتكامل</p></div>
    `;return N(`كارت الصنف - ${i.name}`,"#1e40af",z)},X=t=>{const{products:h}=t,r=h.filter(n=>M(n)<=(n.reorderPoint||0)),a=`
        <div class="header"><h1>شركة أوتو هاوس لقطع غيار السيارات</h1><h2>تقرير حد الطلب</h2><p>تاريخ التقرير: ${v(new Date().toISOString())}</p></div>
        <table>
            <thead><tr><th>الصنف</th><th>الكود</th><th>الرصيد الحالي</th><th>حد الطلب</th></tr></thead>
            <tbody>
                ${r.length>0?r.map(n=>{const b=M(n);return`<tr>
                        <td>${n.name}</td>
                        <td>${n.sku}</td>
                        <td class="font-bold text-red-600">${b}</td>
                        <td>${n.reorderPoint}</td>
                    </tr>`}).join(""):'<tr><td colspan="4" style="text-align: center; padding: 20px;">لا توجد أصناف وصلت إلى حد الطلب.</td></tr>'}
            </tbody>
        </table>
        <div class="footer"><p>تم إنشاء هذا التقرير بواسطة نظام إدارة شركة أوتو هاوس المتكامل</p></div>
    `;return N("تقرير حد الطلب","#f59e0b",a)},tt=(t,h,r)=>{const{dailySales:a,products:n}=t;let b=a;h&&r&&(b=a.filter(d=>d.date>=h&&d.date<=r));const p=new Map;b.forEach(d=>{E(d).forEach(m=>{const y=n.find(z=>z.id===m.productId);if(!y)return;const w=p.get(m.productId)||{name:y.name,sku:y.sku,quantity:0,value:0},A=d.direction==="مرتجع"?-1:1;w.quantity+=m.quantity*A,w.value+=m.unitPrice*m.quantity*A,p.set(m.productId,w)})});const g=Array.from(p.values()).sort((d,m)=>m.quantity-d.quantity),i=g.slice(0,10),s=g.filter(d=>d.quantity<=0).slice(0,10),c=`
        <div class="header"><h1>شركة أوتو هاوس لقطع غيار السيارات</h1><h2>تقرير تحليل المبيعات</h2><p>تاريخ التقرير: ${v(new Date().toISOString())}</p></div>
        
        <div class="sub-header">الأصناف الأكثر مبيعاً (حسب الكمية)</div>
        <table>
            <thead><tr><th>#</th><th>الصنف</th><th>الكود</th><th>الكمية المباعة</th><th>قيمة المبيعات</th></tr></thead>
            <tbody>
                ${i.map((d,m)=>`<tr>
                    <td>${m+1}</td>
                    <td>${d.name}</td>
                    <td>${d.sku}</td>
                    <td class="font-bold text-green-600">${d.quantity}</td>
                    <td>${o(d.value)}</td>
                </tr>`).join("")}
            </tbody>
        </table>
        
        <div class="sub-header">الأصناف الأقل مبيعاً / الراكدة</div>
        <table>
            <thead><tr><th>الصنف</th><th>الكود</th><th>الكمية المباعة</th><th>قيمة المبيعات</th></tr></thead>
            <tbody>
                ${s.length>0?s.map(d=>`<tr>
                    <td>${d.name}</td>
                    <td>${d.sku}</td>
                    <td class="font-bold text-red-600">${d.quantity}</td>
                    <td>${o(d.value)}</td>
                </tr>`).join(""):'<tr><td colspan="4" style="text-align: center; padding: 20px;">لا توجد أصناف راكدة.</td></tr>'}
            </tbody>
        </table>

        <div class="footer"><p>تم إنشاء هذا التقرير بواسطة نظام إدارة شركة أوتو هاوس المتكامل</p></div>
    `;return N("تحليل المبيعات","#059669",c)},et=(t,h,r)=>{const{dailySales:a,expenses:n,payroll:b,products:p}=t,g=a.filter(l=>l.date>=h&&l.date<=r),i=n.filter(l=>l.date>=h&&l.date<=r),s=b.filter(l=>l.date>=h&&l.date<=r);let c=0,d=0,m=0,y=0;g.forEach(l=>{const S=E(l);l.direction==="بيع"?(c+=l.totalAmount,S.forEach($=>{const k=p.find(C=>C.id===$.productId);k&&(m+=k.purchasePrice*$.quantity)})):l.direction==="مرتجع"?(d+=Math.abs(l.totalAmount),S.forEach($=>{const k=p.find(C=>C.id===$.productId);k&&(y+=k.purchasePrice*$.quantity)})):l.direction==="تبديل"&&S.forEach($=>{const k=p.find(T=>T.id===$.productId),C=$.quantity*$.unitPrice,x=C-C*(l.discount||0)/100;$.isReturn?(d+=x,k&&(y+=k.purchasePrice*$.quantity)):(c+=x,k&&(m+=k.purchasePrice*$.quantity))})});const w=c-d,A=m-y,z=w-A,e=i.reduce((l,S)=>l+S.amount,0),u=s.reduce((l,S)=>l+Math.max(0,S.basicSalary+(S.incentives||0)-(S.expenseDeductions||0)),0),f=z-e-u,P=`
        ${I("#4f46e5")}
        <div class="header">
            <h1>تقرير تقفيل الحسابات (قائمة الدخل)</h1>
            <h2>الفترة من: ${v(h)} إلى: ${v(r)}</h2>
        </div>

        <div class="summary">
            <h3>ملخص الأرباح والخسائر</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <p>إجمالي المبيعات</p>
                    <strong>${o(c)}</strong>
                </div>
                <div class="summary-item">
                    <p>إجمالي المرتجعات</p>
                    <strong>${o(d)}</strong>
                </div>
                <div class="summary-item">
                    <p>صافي المبيعات</p>
                    <strong>${o(w)}</strong>
                </div>
                <div class="summary-item">
                    <p>تكلفة البضاعة المباعة</p>
                    <strong>${o(A)}</strong>
                </div>
                <div class="summary-item" style="background-color: #f0fdf4; border-color: #22c55e;">
                    <p style="color: #166534; font-weight: bold;">مجمل الربح</p>
                    <strong style="color: #15803d;">${o(z)}</strong>
                </div>
                <div class="summary-item">
                    <p>إجمالي المصروفات</p>
                    <strong>${o(e)}</strong>
                </div>
                <div class="summary-item">
                    <p>إجمالي تكلفة المرتبات</p>
                    <strong>${o(u)}</strong>
                </div>
                <div class="summary-item" style="background-color: ${f>=0?"#dcfce7":"#fee2e2"}; border-color: ${f>=0?"#22c55e":"#ef4444"};">
                    <p style="color: ${f>=0?"#166534":"#991b1b"}; font-weight: bold;">صافي الربح / الخسارة</p>
                    <strong style="color: ${f>=0?"#15803d":"#b91c1c"}; font-size: 24px;">${o(f)}</strong>
                </div>
            </div>
        </div>

        <div class="sub-header">تفاصيل المصروفات</div>
        <table>
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>النوع</th>
                    <th>البيان</th>
                    <th>المبلغ</th>
                </tr>
            </thead>
            <tbody>
                ${i.length>0?i.map(l=>`
                    <tr>
                        <td dir="ltr">${v(l.date)}</td>
                        <td>${l.type}</td>
                        <td>${l.name}</td>
                        <td>${o(l.amount)}</td>
                    </tr>
                `).join(""):'<tr><td colspan="4" style="text-align: center;">لا توجد مصروفات في هذه الفترة</td></tr>'}
            </tbody>
        </table>

        <div class="sub-header">تفاصيل المرتبات المنصرفة</div>
        <table>
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>الموظف</th>
                    <th>الراتب الأساسي</th>
                    <th>المبلغ المنصرف</th>
                </tr>
            </thead>
            <tbody>
                ${s.length>0?s.map(l=>{const S=t.employees.find($=>$.id===l.employeeId);return`
                    <tr>
                        <td dir="ltr">${v(l.date)}</td>
                        <td>${S?S.name:"غير معروف"}</td>
                        <td>${o(l.basicSalary)}</td>
                        <td>${o(l.disbursed)}</td>
                    </tr>
                `}).join(""):'<tr><td colspan="4" style="text-align: center;">لا توجد مرتبات منصرفة في هذه الفترة</td></tr>'}
            </tbody>
        </table>
        <div class="footer"><p>تم إنشاء هذا التقرير بواسطة نظام إدارة شركة أوتو هاوس المتكامل</p></div>
    `;return N("تقرير تقفيل الحسابات","#4f46e5",P)},ot=(t,h,r)=>{const a=`
        ${I("#0891b2")}
        <div class="header">
            <h1>تقرير مراجعة اليوميات</h1>
            <h2>الفترة من: ${v(h)} إلى: ${v(r)}</h2>
        </div>

        <table>
            <thead>
                <tr>
                    <th>التاريخ</th>
                    <th>الفرع</th>
                    <th>مبيعات المحل</th>
                    <th>طلبات الأونلاين</th>
                    <th>المصروفات</th>
                    <th>رصيد الدرج</th>
                    <th>ملاحظات</th>
                </tr>
            </thead>
            <tbody>
                ${t.length>0?t.map(n=>`
                    <tr>
                        <td dir="ltr">${v(n.date)}</td>
                        <td>${j[n.branch]||n.branch}</td>
                        <td>
                            <div>${o(n.totalSales)}</div>
                            <div style="font-size: 10px; color: #666;">كاش: ${o(n.salesCash)} | إلكتروني: ${o(n.salesElectronic)}</div>
                        </td>
                        <td>
                            <div>${o(n.onlineOrdersTotal||0)}</div>
                            <div style="font-size: 10px; color: #666;">عدد: ${n.onlineOrdersCount||0}</div>
                        </td>
                        <td>${o(n.expensesTotal||0)}</td>
                        <td style="font-weight: bold;">${o(n.drawerBalance)}</td>
                        <td style="font-size: 10px;">${n.notes||"-"}</td>
                    </tr>
                `).join(""):'<tr><td colspan="7" style="text-align: center;">لا توجد مراجعات في هذه الفترة</td></tr>'}
            </tbody>
        </table>
        <div class="footer"><p>تم إنشاء هذا التقرير بواسطة نظام إدارة شركة أوتو هاوس المتكامل</p></div>
    `;return N("تقرير مراجعة اليوميات","#0891b2",a)};export{O as branchAddresses,j as branchNames,ot as generateDailyReviewReportContent,Z as generateEmployeesReportContent,J as generateFilteredSalesReportContent,et as generateFinancialClosingReportContent,B as generateInvoiceContent,Q as generateProductCardexReportContent,X as generateReorderPointReportContent,tt as generateSalesAnalysisReportContent,Y as generateSalesReportContent,K as generateSuppliersReportContent,V as triggerInvoicePrint};
