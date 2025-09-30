export const translations = {
  en: {
    // Panel Titles
    projectNavigator: 'Project Navigator',
    animationEditor: 'Animation Editor',
    properties: 'Properties',
    timeline: 'Timeline',
    iconInfo: 'Icon Info',
    languages: 'Languages',
    
    // Header
    file: 'File',
    preferences: 'Preferences',
    view: 'View',
    windows: 'Windows',
    tools: 'Tools',
    help: 'Help',
    language: 'Language',
    noActions: 'No actions available',

    // Buttons
    export: 'Export',
    add: 'Add',
    delete: 'Delete',
    addImage: 'Add Image',
    addFile: 'Add File',
    newSprite: 'New Sprite',

    // Project Navigator
    projectEmpty: 'Project is empty.',
    noFileSelect: 'No file Select',

    // Animation Editor
    noAnimationSelected: 'No Animation Selected',
    noAnimationSelectedDesc: 'Select a folder with images in the Project Navigator to begin.',
    frame: 'Frame',
    centerView: 'Center View',

    // Properties Panel
    texture: 'Texture',
    name: 'Name',
    dataFormat: 'Data Format',
    textureName: 'Texture Name',
    dataFile: 'Data File',
    scale: 'Scale',
    packing: 'Packing',
    padding: 'Padding',
    allowTrim: 'Allow Trim',
    allowRotation: 'Allow Rotation',
    maxWidth: 'Max Width',
    maxHeight: 'Max Height',
    powerOfTwo: 'Power of Two',
    animation: 'Animation',
    currentAnim: 'Current Animation',
    frameRate: 'Frame Rate',
    algorithm: 'Algorithm',
    
    // Timeline Panel
    frames: 'Frames',
    noImages: 'No images in selected folder.',
    
    // Icon Info Panel
    icon: 'Icon:',

    // Language Panel
    selectLanguage: 'Select Language',
    english: 'English',
    spanish: 'Spanish',
  },
  es: {
    // Panel Titles
    projectNavigator: 'Navegador de Proyectos',
    animationEditor: 'Editor de Animación',
    properties: 'Propiedades',
    timeline: 'Línea de Tiempo',
    iconInfo: 'Info del Icono',
    languages: 'Idiomas',

    // Header
    file: 'Archivo',
    preferences: 'Preferencias',
    view: 'Ver',
    windows: 'Ventanas',
    tools: 'Herramientas',
    help: 'Ayuda',
    language: 'Idioma',
    noActions: 'No hay acciones disponibles',

    // Buttons
    export: 'Exportar',
    add: 'Añadir',
    delete: 'Eliminar',
    addImage: 'Añadir Imagen',
    addFile: 'Añadir Archivo',
    newSprite: 'Nuevo Sprite',

    // Project Navigator
    projectEmpty: 'El proyecto está vacío.',
    noFileSelect: 'Ningún archivo seleccionado',

    // Animation Editor
    noAnimationSelected: 'Ninguna Animación Seleccionada',
    noAnimationSelectedDesc: 'Selecciona una carpeta con imágenes en el Navegador de Proyectos para comenzar.',
    frame: 'Fotograma',
    centerView: 'Centrar Vista',
    
    // Properties Panel
    texture: 'Textura',
    name: 'Nombre',
    dataFormat: 'Formato de Datos',
    textureName: 'Nombre de Textura',
    dataFile: 'Archivo de Datos',
    scale: 'Escala',
    packing: 'Empaquetado',
    padding: 'Relleno',
    allowTrim: 'Permitir Recorte',
    allowRotation: 'Permitir Rotación',
    maxWidth: 'Ancho Máximo',
    maxHeight: 'Alto Máximo',
    powerOfTwo: 'Potencia de Dos',
    animation: 'Animación',
    currentAnim: 'Animación Actual',
    frameRate: 'Fotogramas/Segundo',
    algorithm: 'Algoritmo',
    
    // Timeline Panel
    frames: 'Fotogramas',
    noImages: 'No hay imágenes en la carpeta seleccionada.',

    // Icon Info Panel
    icon: 'Icono:',

    // Language Panel
    selectLanguage: 'Seleccionar Idioma',
    english: 'Inglés',
    spanish: 'Español',
  }
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations['en'];
