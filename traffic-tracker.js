/**
 * Traffic Tracker - Sistema de monitoreo de tráfico web
 * Captura eventos de usuario y almacena datos para análisis
 */

class TrafficTracker {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = new Date();
        this.events = [];
        this.pageViews = 0;
        this.clickEvents = [];
        this.scrollDepth = 0;
        this.timeOnPage = 0;
        this.deviceInfo = this.getDeviceInfo();

        // Inicializar almacenamiento
        this.loadData();
        this.initializeTracking();
    }

    /**
     * Generar ID único de sesión
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Obtener información del dispositivo
     */
    getDeviceInfo() {
        const ua = navigator.userAgent;
        let browser = 'Desconocido';
        let os = 'Desconocido';
        let device = 'Desktop';

        // Detectar navegador
        if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
        else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
        else if (ua.indexOf('Safari') > -1) browser = 'Safari';
        else if (ua.indexOf('Edge') > -1) browser = 'Edge';

        // Detectar SO
        if (ua.indexOf('Windows') > -1) os = 'Windows';
        else if (ua.indexOf('Mac') > -1) os = 'macOS';
        else if (ua.indexOf('Linux') > -1) os = 'Linux';
        else if (ua.indexOf('Android') > -1) os = 'Android';
        else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';

        // Detectar tipo de dispositivo
        if (/Mobile|Android|iPhone|iPad|iPod/.test(ua)) {
            device = /iPad/.test(ua) ? 'Tablet' : 'Mobile';
        }

        return {
            browser,
            os,
            device,
            screenResolution: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Inicializar el rastreo de eventos
     */
    initializeTracking() {
        // Rastrear clics
        document.addEventListener('click', (e) => this.trackClick(e));

        // Rastrear scroll
        window.addEventListener('scroll', () => this.trackScroll());

        // Rastrear tiempo en página
        setInterval(() => this.updateTimeOnPage(), 1000);

        // Rastrear visibilidad de página
        document.addEventListener('visibilitychange', () => this.trackVisibility());

        // Rastrear enlaces externos
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && e.target.href && !e.target.href.includes(window.location.hostname)) {
                this.trackExternalLink(e.target.href);
            }
        });

        // Rastrear cuando el usuario abandona la página
        window.addEventListener('beforeunload', () => this.saveData());

        // Rastrear cambios de tamaño de ventana
        window.addEventListener('resize', () => this.trackResize());

        // Rastrear eventos de productos (clics en tarjetas)
        this.trackProductInteractions();

        console.log('Traffic Tracker inicializado - Session ID:', this.sessionId);
    }

    /**
     * Rastrear clics en la página
     */
    trackClick(event) {
        const target = event.target.closest('[data-trackable]') || event.target;
        const clickData = {
            type: 'click',
            element: target.tagName,
            class: target.className,
            text: target.textContent?.substring(0, 50) || '',
            timestamp: new Date().toISOString(),
            x: event.clientX,
            y: event.clientY
        };

        this.events.push(clickData);
        this.clickEvents.push(clickData);

        // Guardar cada 10 clics
        if (this.clickEvents.length % 10 === 0) {
            this.saveData();
        }
    }

    /**
     * Rastrear scroll
     */
    trackScroll() {
        const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        this.scrollDepth = Math.max(this.scrollDepth, scrollPercentage);
    }

    /**
     * Actualizar tiempo en página
     */
    updateTimeOnPage() {
        this.timeOnPage = Math.floor((new Date() - this.startTime) / 1000);
    }

    /**
     * Rastrear visibilidad de página
     */
    trackVisibility() {
        const visibilityData = {
            type: 'visibility',
            hidden: document.hidden,
            timestamp: new Date().toISOString()
        };
        this.events.push(visibilityData);
    }

    /**
     * Rastrear enlaces externos
     */
    trackExternalLink(url) {
        const linkData = {
            type: 'external_link',
            url: url,
            timestamp: new Date().toISOString()
        };
        this.events.push(linkData);
        this.saveData();
    }

    /**
     * Rastrear cambios de tamaño
     */
    trackResize() {
        const resizeData = {
            type: 'resize',
            width: window.innerWidth,
            height: window.innerHeight,
            timestamp: new Date().toISOString()
        };
        this.events.push(resizeData);
    }

    /**
     * Rastrear interacciones con productos
     */
    trackProductInteractions() {
        // Rastrear clics en tarjetas de productos
        document.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            if (productCard) {
                const productName = productCard.querySelector('.product-name')?.textContent || 'Desconocido';
                const productData = {
                    type: 'product_view',
                    product: productName,
                    timestamp: new Date().toISOString()
                };
                this.events.push(productData);
            }

            // Rastrear clics en botones de compra
            if (e.target.classList.contains('btn-primary') || e.target.classList.contains('btn-nequi') || e.target.classList.contains('btn-paypal')) {
                const purchaseData = {
                    type: 'purchase_attempt',
                    buttonType: e.target.className,
                    timestamp: new Date().toISOString()
                };
                this.events.push(purchaseData);
                this.saveData();
            }

            // Rastrear clics en botones "like"
            if (e.target.closest('.like-btn')) {
                const likeData = {
                    type: 'like_click',
                    timestamp: new Date().toISOString()
                };
                this.events.push(likeData);
            }
        });
    }

    /**
     * Obtener resumen de datos de sesión
     */
    getSessionSummary() {
        return {
            sessionId: this.sessionId,
            startTime: this.startTime.toISOString(),
            timeOnPage: this.timeOnPage,
            scrollDepth: Math.round(this.scrollDepth),
            totalClicks: this.clickEvents.length,
            totalEvents: this.events.length,
            deviceInfo: this.deviceInfo,
            eventsByType: this.getEventsByType(),
            topProducts: this.getTopProducts()
        };
    }

    /**
     * Agrupar eventos por tipo
     */
    getEventsByType() {
        const grouped = {};
        this.events.forEach(event => {
            grouped[event.type] = (grouped[event.type] || 0) + 1;
        });
        return grouped;
    }

    /**
     * Obtener productos más vistos
     */
    getTopProducts() {
        const productViews = {};
        this.events
            .filter(e => e.type === 'product_view')
            .forEach(e => {
                productViews[e.product] = (productViews[e.product] || 0) + 1;
            });
        return Object.entries(productViews)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }

    /**
     * Guardar datos en localStorage
     */
    saveData() {
        const allSessions = this.getAllSessions();
        const currentSession = this.getSessionSummary();

        // Actualizar sesión actual
        const sessionIndex = allSessions.findIndex(s => s.sessionId === this.sessionId);
        if (sessionIndex > -1) {
            allSessions[sessionIndex] = currentSession;
        } else {
            allSessions.push(currentSession);
        }

        // Guardar en localStorage (máximo 50 sesiones)
        if (allSessions.length > 50) {
            allSessions.shift();
        }

        localStorage.setItem('trafficTrackerData', JSON.stringify(allSessions));
        localStorage.setItem('lastUpdate', new Date().toISOString());
    }

    /**
     * Cargar datos del localStorage
     */
    loadData() {
        const stored = localStorage.getItem('trafficTrackerData');
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Obtener todas las sesiones
     */
    getAllSessions() {
        return this.loadData();
    }

    /**
     * Obtener estadísticas globales
     */
    getGlobalStats() {
        const allSessions = this.getAllSessions();

        if (allSessions.length === 0) return null;

        const totalSessions = allSessions.length;
        const totalTimeOnPage = allSessions.reduce((sum, s) => sum + s.timeOnPage, 0);
        const avgTimeOnPage = Math.round(totalTimeOnPage / totalSessions);
        const avgScrollDepth = Math.round(allSessions.reduce((sum, s) => sum + s.scrollDepth, 0) / totalSessions);
        const totalClicks = allSessions.reduce((sum, s) => sum + s.totalClicks, 0);

        // Contar dispositivos
        const devices = {};
        allSessions.forEach(s => {
            const device = s.deviceInfo.device;
            devices[device] = (devices[device] || 0) + 1;
        });

        // Contar navegadores
        const browsers = {};
        allSessions.forEach(s => {
            const browser = s.deviceInfo.browser;
            browsers[browser] = (browsers[browser] || 0) + 1;
        });

        // Contar SO
        const operatingSystems = {};
        allSessions.forEach(s => {
            const os = s.deviceInfo.os;
            operatingSystems[os] = (operatingSystems[os] || 0) + 1;
        });

        return {
            totalSessions,
            avgTimeOnPage,
            avgScrollDepth,
            totalClicks,
            devices,
            browsers,
            operatingSystems,
            lastUpdate: localStorage.getItem('lastUpdate')
        };
    }

    /**
     * Limpiar datos
     */
    clearData() {
        localStorage.removeItem('trafficTrackerData');
        localStorage.removeItem('lastUpdate');
        this.events = [];
        this.clickEvents = [];
        console.log('Datos de tráfico eliminados');
    }

    /**
     * Exportar datos como JSON
     */
    exportData() {
        const data = {
            allSessions: this.getAllSessions(),
            globalStats: this.getGlobalStats(),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }

    /**
     * Descargar datos como archivo JSON
     */
    downloadData() {
        const data = this.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `traffic_data_${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Inicializar tracker cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.trafficTracker = new TrafficTracker();
    });
} else {
    window.trafficTracker = new TrafficTracker();
}
