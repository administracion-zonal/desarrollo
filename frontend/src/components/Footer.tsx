export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <img
          src="/LosChillos-footer.png"
          alt="Institución"
          className="header-footer"
        />
      </div>

      <div className="footer-info">
        <p className="footer-title">
          Administración Zonal Valle de los Chillos
        </p>
        <p>
          <strong>Dirección:</strong> Calle Gribaldo Miño s/n y avenida Ilaló
          (Hacienda San José), barrio San José, parroquia Conocoto.
        </p>
        <p>
          <strong>Teléfono:</strong> 3989300{" "}
          <strong>Administrador Zonal:</strong> Ext. 22804{" "}
          <strong>Correo:</strong> tramitesloschillos@quito.gob.ec
        </p>
        <p>Quito - Ecuador</p>
      </div>
    </footer>
  );
}
