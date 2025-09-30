import React, { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';

type Condition = 'Excelente' | 'Buena' | 'Regular' | 'Necesita trabajo';

type VehicleModel = {
  name: string;
  referenceYear: number;
  basePrice: number;
  depreciationRate: number;
};

type VehicleBrand = {
  brand: string;
  origin: string;
  models: VehicleModel[];
};

const VEHICLE_CATALOG: VehicleBrand[] = [
  {
    brand: 'Toyota',
    origin: 'Japón',
    models: [
      { name: 'Corolla XLI', referenceYear: 2023, basePrice: 9500000, depreciationRate: 0.06 },
      { name: 'Hilux SRV 4x4', referenceYear: 2024, basePrice: 21500000, depreciationRate: 0.07 },
      { name: 'Yaris XS', referenceYear: 2022, basePrice: 8200000, depreciationRate: 0.055 },
    ],
  },
  {
    brand: 'Chevrolet',
    origin: 'Estados Unidos',
    models: [
      { name: 'Cruze LT', referenceYear: 2023, basePrice: 11200000, depreciationRate: 0.065 },
      { name: 'Tracker Premier', referenceYear: 2024, basePrice: 16900000, depreciationRate: 0.06 },
      { name: 'S10 High Country', referenceYear: 2024, basePrice: 24800000, depreciationRate: 0.075 },
    ],
  },
  {
    brand: 'Volkswagen',
    origin: 'Alemania',
    models: [
      { name: 'Nivus Highline', referenceYear: 2023, basePrice: 16700000, depreciationRate: 0.06 },
      { name: 'Amarok V6 Extreme', referenceYear: 2024, basePrice: 28500000, depreciationRate: 0.08 },
      { name: 'Polo Track', referenceYear: 2022, basePrice: 7200000, depreciationRate: 0.055 },
    ],
  },
  {
    brand: 'Peugeot',
    origin: 'Francia',
    models: [
      { name: '208 Feline', referenceYear: 2023, basePrice: 13800000, depreciationRate: 0.058 },
      { name: '3008 Allure', referenceYear: 2024, basePrice: 23600000, depreciationRate: 0.07 },
      { name: 'Expert Furgón', referenceYear: 2024, basePrice: 21500000, depreciationRate: 0.072 },
    ],
  },
];

const CONDITION_ADJUSTMENTS: Record<Condition, number> = {
  Excelente: 0.06,
  Buena: 0,
  Regular: -0.08,
  'Necesita trabajo': -0.17,
};

const EXTRA_OPTIONS = [
  { id: 'service_history', label: 'Historial de mantenimiento al día', factor: 0.03 },
  { id: 'tyres', label: 'Cubiertas nuevas (menos de 5.000 km)', factor: 0.02 },
  { id: 'accessories', label: 'Accesorios originales instalados', factor: 0.015 },
  { id: 'warranty', label: 'Garantía vigente', factor: 0.025 },
];

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    fontFamily: '"Montserrat", system-ui, sans-serif',
    background: 'radial-gradient(circle at top, #f5f7ff 0%, #e0e7ff 45%, #f8fafc 100%)',
    color: '#0f172a',
    padding: '3.5rem 1.5rem 4rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  layout: {
    width: 'min(1100px, 100%)',
    display: 'grid',
    gap: '2rem',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: '22px',
    boxShadow: '0 18px 45px rgba(15,23,42,0.12)',
    padding: '2rem',
    backdropFilter: 'blur(6px)',
    border: '1px solid rgba(99,102,241,0.15)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2.5rem',
  },
  title: {
    fontSize: 'clamp(2.4rem, 3vw, 3.2rem)',
    fontWeight: 700,
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1.05rem',
    opacity: 0.85,
    maxWidth: '680px',
    margin: '0 auto',
  },
  formGroup: {
    marginBottom: '1.2rem',
  },
  label: {
    display: 'block',
    fontWeight: 600,
    fontSize: '0.95rem',
    marginBottom: '0.45rem',
  },
  select: {
    width: '100%',
    borderRadius: '12px',
    border: '1px solid #c7d2fe',
    padding: '0.75rem 0.9rem',
    fontSize: '0.95rem',
    backgroundColor: '#fff',
    boxShadow: '0 1px 0 rgba(15,23,42,0.05)',
    outlineColor: '#4f46e5',
  },
  input: {
    width: '100%',
    borderRadius: '12px',
    border: '1px solid #c7d2fe',
    padding: '0.75rem 0.9rem',
    fontSize: '0.95rem',
    boxShadow: '0 1px 0 rgba(15,23,42,0.05)',
    outlineColor: '#4f46e5',
  },
  extrasContainer: {
    display: 'grid',
    gap: '0.6rem',
  },
  checkboxRow: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '0.75rem',
    alignItems: 'center',
    padding: '0.75rem',
    borderRadius: '14px',
    border: '1px solid rgba(99,102,241,0.2)',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  resultTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '1.2rem',
  },
  breakdown: {
    borderRadius: '16px',
    backgroundColor: 'rgba(79,70,229,0.08)',
    padding: '1.4rem',
    marginTop: '1.4rem',
  },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
    fontSize: '0.95rem',
  },
  buttonPrimary: {
    width: '100%',
    marginTop: '1.6rem',
    padding: '0.9rem 1rem',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 14px 35px rgba(79,70,229,0.25)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    padding: '0.35rem 0.8rem',
    borderRadius: '9999px',
    background: 'rgba(59,130,246,0.15)',
    color: '#1d4ed8',
    fontSize: '0.85rem',
    fontWeight: 600,
    marginBottom: '1.5rem',
  },
  summaryList: {
    marginTop: '1.6rem',
    paddingLeft: '1.1rem',
    color: '#334155',
  },
  summaryItem: {
    marginBottom: '0.75rem',
    lineHeight: 1.4,
  },
};

type ValuationResult = {
  finalPrice: number;
  basePrice: number;
  yearAdjustment: number;
  mileageAdjustment: number;
  conditionAdjustment: number;
  extrasAdjustment: number;
  expectedMileage: number;
};

const currentYear = new Date().getFullYear();

function calculateMileageExpectation(year: number) {
  const yearsInUse = Math.max(1, currentYear - year + 1);
  return yearsInUse * 16000;
}

function calculateValuation(
  vehicle: VehicleModel,
  year: number,
  mileage: number,
  condition: Condition,
  selectedExtras: string[],
): ValuationResult {
  let price = vehicle.basePrice;
  const breakdown = {
    basePrice: vehicle.basePrice,
    yearAdjustment: 0,
    mileageAdjustment: 0,
    conditionAdjustment: 0,
    extrasAdjustment: 0,
  };

  const yearsDifference = vehicle.referenceYear - year;
  if (yearsDifference > 0) {
    const factor = Math.pow(1 - vehicle.depreciationRate, yearsDifference);
    const adjusted = price * factor;
    breakdown.yearAdjustment = adjusted - price;
    price = adjusted;
  } else if (yearsDifference < 0) {
    const appreciationFactor = Math.pow(1.02, Math.abs(yearsDifference));
    const adjusted = price * appreciationFactor;
    breakdown.yearAdjustment = adjusted - price;
    price = adjusted;
  }

  const expectedMileage = calculateMileageExpectation(year);
  const mileageDifference = mileage - expectedMileage;
  if (Math.abs(mileageDifference) > 1000) {
    const perTenKmFactor = 0.008; // 0.8 % cada 10.000 km
    const steps = mileageDifference / 10000;
    const adjustment = -price * perTenKmFactor * steps;
    breakdown.mileageAdjustment = adjustment;
    price += adjustment;
  }

  const conditionFactor = CONDITION_ADJUSTMENTS[condition];
  const conditionAdjustment = price * conditionFactor;
  breakdown.conditionAdjustment = conditionAdjustment;
  price += conditionAdjustment;

  const extrasValue = selectedExtras.reduce((acc, extraId) => {
    const extra = EXTRA_OPTIONS.find((option) => option.id === extraId);
    return extra ? acc + price * extra.factor : acc;
  }, 0);
  breakdown.extrasAdjustment = extrasValue;
  price += extrasValue;

  return {
    finalPrice: Math.max(price, vehicle.basePrice * 0.45),
    expectedMileage,
    ...breakdown,
  };
}

export default function App() {
  const [brand, setBrand] = useState('Toyota');
  const [modelName, setModelName] = useState('Corolla XLI');
  const [year, setYear] = useState(currentYear - 2);
  const [mileage, setMileage] = useState(40000);
  const [condition, setCondition] = useState<Condition>('Buena');
  const [extras, setExtras] = useState<string[]>(['service_history']);

  const selectedBrand = useMemo(
    () => VEHICLE_CATALOG.find((item) => item.brand === brand) ?? VEHICLE_CATALOG[0],
    [brand],
  );

  const selectedModel = useMemo(
    () => selectedBrand.models.find((model) => model.name === modelName) ?? selectedBrand.models[0],
    [selectedBrand, modelName],
  );

  const valuation = useMemo(() => {
    return calculateValuation(selectedModel, year, mileage, condition, extras);
  }, [selectedModel, year, mileage, condition, extras]);

  const handleExtrasChange = (id: string) => {
    setExtras((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const lineHeight = 8;
    let cursor = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Reporte de valoración - JB Autos', 20, cursor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    cursor += lineHeight * 1.8;

    doc.text(`Marca: ${selectedBrand.brand}`, 20, cursor);
    cursor += lineHeight;
    doc.text(`Modelo: ${selectedModel.name}`, 20, cursor);
    cursor += lineHeight;
    doc.text(`Año declarado: ${year}`, 20, cursor);
    cursor += lineHeight;
    doc.text(`Kilometraje: ${mileage.toLocaleString('es-AR')} km`, 20, cursor);
    cursor += lineHeight;
    doc.text(`Condición: ${condition}`, 20, cursor);
    cursor += lineHeight * 1.4;

    doc.setFont('helvetica', 'bold');
    doc.text('Resumen de valoración', 20, cursor);
    cursor += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.text(`Precio base de referencia: ${currencyFormatter.format(valuation.basePrice)}`, 20, cursor);
    cursor += lineHeight;
    doc.text(`Ajuste por año: ${currencyFormatter.format(valuation.yearAdjustment)}`, 20, cursor);
    cursor += lineHeight;
    doc.text(`Ajuste por kilometraje: ${currencyFormatter.format(valuation.mileageAdjustment)}`, 20, cursor);
    cursor += lineHeight;
    doc.text(`Ajuste por condición: ${currencyFormatter.format(valuation.conditionAdjustment)}`, 20, cursor);
    cursor += lineHeight;
    doc.text(`Valor agregado de extras: ${currencyFormatter.format(valuation.extrasAdjustment)}`, 20, cursor);
    cursor += lineHeight * 1.4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`VALOR ESTIMADO: ${currencyFormatter.format(valuation.finalPrice)}`, 20, cursor);
    cursor += lineHeight * 1.6;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Kilometraje esperado para este año: ${Math.round(valuation.expectedMileage).toLocaleString('es-AR')} km`,
      20,
      cursor,
    );
    cursor += lineHeight * 1.5;

    const notes = [
      'Esta tasación es una referencia basada en datos de mercado y ajustes propios de JB Autos.',
      'Los valores finales pueden variar según peritaje mecánico y documentación respaldatoria.',
      'Se recomienda revisar precios de operaciones recientes en la región antes de publicar la unidad.',
    ];

    notes.forEach((note) => {
      doc.text(`• ${note}`, 20, cursor, { maxWidth: 170 });
      cursor += lineHeight;
    });

    doc.save(`valuacion-${selectedBrand.brand}-${selectedModel.name}.pdf`);
  };

  const years = Array.from({ length: 16 }, (_, index) => currentYear - index);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.badge}>
          <span role="img" aria-hidden>
            📊
          </span>
          Valuador inteligente JB Autos
        </div>
        <h1 style={styles.title}>Calculá el valor actualizado de un vehículo usado</h1>
        <p style={styles.subtitle}>
          Elegí el vehículo, completá sus datos principales y obtené una estimación basada en valores de mercado, estado de la
          unidad y extras disponibles. Luego descargá un informe profesional listo para compartir con tus clientes.
        </p>
      </header>

      <div style={styles.layout}>
        <section style={styles.card}>
          <div style={styles.formGroup}>
            <label htmlFor="brand" style={styles.label}>
              Marca
            </label>
            <select
              id="brand"
              value={brand}
              onChange={(event) => {
                const selected = event.target.value;
                setBrand(selected);
                const defaultModel =
                  VEHICLE_CATALOG.find((item) => item.brand === selected)?.models[0]?.name ?? modelName;
                setModelName(defaultModel);
              }}
              style={styles.select}
            >
              {VEHICLE_CATALOG.map((item) => (
                <option key={item.brand} value={item.brand}>
                  {item.brand} · origen {item.origin}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="model" style={styles.label}>
              Modelo
            </label>
            <select
              id="model"
              value={modelName}
              onChange={(event) => setModelName(event.target.value)}
              style={styles.select}
            >
              {selectedBrand.models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name} · ref. {model.referenceYear}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="year" style={styles.label}>
              Año del vehículo
            </label>
            <select id="year" value={year} onChange={(event) => setYear(Number(event.target.value))} style={styles.select}>
              {years.map((optionYear) => (
                <option key={optionYear} value={optionYear}>
                  {optionYear}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="mileage" style={styles.label}>
              Kilometraje
            </label>
            <input
              id="mileage"
              type="number"
              min={0}
              value={mileage}
              onChange={(event) => setMileage(Number(event.target.value))}
              style={styles.input}
            />
            <small style={{ display: 'block', marginTop: '0.35rem', color: '#64748b' }}>
              Sugerencia: un promedio anual esperado es de {Math.round(calculateMileageExpectation(year)).toLocaleString('es-AR')} km.
            </small>
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="condition" style={styles.label}>
              Estado general
            </label>
            <select
              id="condition"
              value={condition}
              onChange={(event) => setCondition(event.target.value as Condition)}
              style={styles.select}
            >
              {Object.keys(CONDITION_ADJUSTMENTS).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div style={{ ...styles.formGroup, marginBottom: '0.6rem' }}>
            <span style={styles.label}>Extras que suman valor</span>
            <div style={styles.extrasContainer}>
              {EXTRA_OPTIONS.map((option) => (
                <label key={option.id} style={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={extras.includes(option.id)}
                    onChange={() => handleExtrasChange(option.id)}
                    style={{ width: 18, height: 18 }}
                  />
                  <span>
                    {option.label}
                    <br />
                    <small style={{ color: '#475569' }}>Impacto estimado: {Math.round(option.factor * 100)}%</small>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button type="button" style={styles.buttonPrimary} onClick={handleDownloadPdf}>
            Descargar informe en PDF
          </button>
        </section>

        <section style={styles.card}>
          <h2 style={styles.resultTitle}>Valor estimado para la unidad</h2>
          <p style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '1.2rem', lineHeight: 1.6 }}>
            Con la información que proporcionaste, estimamos el valor comercial actualizado considerando ajustes por año,
            kilometraje, estado general y valor agregado por extras destacados.
          </p>

          <div
            style={{
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #312e81 0%, #4338ca 50%, #4f46e5 100%)',
              color: '#fff',
              padding: '1.8rem',
              marginBottom: '1.6rem',
              boxShadow: '0 20px 40px rgba(30,64,175,0.25)',
            }}
          >
            <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8 }}>Valor estimado</div>
            <div style={{ fontSize: '2.4rem', fontWeight: 700, marginTop: '0.35rem' }}>
              {currencyFormatter.format(valuation.finalPrice)}
            </div>
            <div style={{ marginTop: '0.6rem', fontSize: '0.95rem', opacity: 0.85 }}>
              Referencia {selectedModel.referenceYear} · {selectedBrand.brand} {selectedModel.name}
            </div>
          </div>

          <div style={styles.breakdown}>
            <div style={styles.breakdownRow}>
              <span>Precio base de referencia</span>
              <strong>{currencyFormatter.format(valuation.basePrice)}</strong>
            </div>
            <div style={styles.breakdownRow}>
              <span>Ajuste por año seleccionado</span>
              <strong>{currencyFormatter.format(valuation.yearAdjustment)}</strong>
            </div>
            <div style={styles.breakdownRow}>
              <span>Ajuste por kilometraje</span>
              <strong>{currencyFormatter.format(valuation.mileageAdjustment)}</strong>
            </div>
            <div style={styles.breakdownRow}>
              <span>Condición declarada</span>
              <strong>{currencyFormatter.format(valuation.conditionAdjustment)}</strong>
            </div>
            <div style={{ ...styles.breakdownRow, marginBottom: 0 }}>
              <span>Extras seleccionados</span>
              <strong>{currencyFormatter.format(valuation.extrasAdjustment)}</strong>
            </div>
          </div>

          <ul style={styles.summaryList}>
            <li style={styles.summaryItem}>
              Kilometraje esperado para {year}: {Math.round(valuation.expectedMileage).toLocaleString('es-AR')} km. Tu unidad se encuentra{' '}
              {Math.abs(mileage - valuation.expectedMileage) < 2000 ? 'dentro del promedio' : mileage > valuation.expectedMileage ? 'por encima del promedio, lo que genera una penalización.' : 'por debajo del promedio, ¡gran noticia!'}
            </li>
            <li style={styles.summaryItem}>
              Ajustá el precio de publicación entre un 3% y un 7% según la urgencia de venta y negociaciones habituales en la zona.
            </li>
            <li style={styles.summaryItem}>
              Para maximizar el valor: mantené servicios documentados, presentá informes técnicos y destacá extras incluidos en la publicación.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
