import { publicAssets } from "../utils/publicAssets";

export default function Footer() {
  return (
    <footer className="footer">
      <img
        src={publicAssets.footerBanner}
        alt="Institución"
        className="header-footer"
      />
      <p>
        <strong>Dirección:</strong> Calle Gribaldo Miño s/n y avenida Ilaló
        (Hacienda San José), en el barrio San José, parroquia Conocoto. <br />
        <strong>Teléfono:</strong> 3989300 |
        <strong> Administrador Zonal:</strong> Ext. 22804 |
        <strong> Correo:</strong> tramitesloschillos@quito.gob.ec <br />
        Quito – Ecuador
      </p>
    </footer>
  );
}
