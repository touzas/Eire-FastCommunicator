### **Prompt para una IA generativa de código:**

**Rol:** Eres un desarrollador experto en React Native con Expo.

**Tarea:** Crea una aplicación de comunicación aumentativa y alternativa (CAA) para iOS y Android usando React Native, Expo, TypeScript y Expo Router. La aplicación permitirá a los usuarios construir frases seleccionando pictogramas y texto, y luego reproducirlas en voz alta.

**Funcionalidades Clave:**

1.  **Pantalla Principal (Constructor de Frases):**
    *   Debe haber una barra de búsqueda para encontrar frases predefinidas. La búsqueda debe ser "inteligente": insensible a mayúsculas y acentos (ej: buscar "bebe" debe encontrar "bebé").
    *   Debajo de la búsqueda, una lista de sugerencias debe mostrar las frases que coincidan.
    *   Al seleccionar una frase de las sugerencias, esta se añade a un "constructor de frases" en la parte superior de la pantalla.
    *   El "constructor de frases" muestra la oración completa que se está formando y los pictogramas asociados a cada frase seleccionada.
    *   Debe haber botones para:
        *   **Reproducir:** Usar `expo-speech` para leer en voz alta la oración completa construida. El idioma debe ser español (`es-ES`).
        *   **Borrar:** Limpiar la selección actual y vaciar el constructor de frases.
    *   Un botón de "Gestionar" (con un icono de engranaje, como `settings-outline` de Ionicons) debe navegar a la pantalla de gestión de frases.

2.  **Pantalla de Gestión de Frases:**
    *   Esta pantalla debe mostrar una lista de todas las frases guardadas.
    *   Debe incluir una barra de búsqueda para filtrar las frases, también insensible a mayúsculas y acentos.
    *   Cada elemento de la lista debe mostrar el texto de la frase, su contador de uso (`usage_count`) y los pictogramas asociados.
    *   Cada frase debe tener botones para **Editar** (icono de lápiz) y **Eliminar** (icono de papelera). La eliminación debe pedir confirmación.
    *   Un botón flotante (FAB) con un icono de "+" debe permitir añadir una nueva frase.

3.  **Gestión de Datos y Estado (CRUD de Frases):**
    *   Utiliza React Context (`PhrasesContext`) para gestionar el estado global de las frases. Esto debe incluir la lista de frases, el estado de carga y las funciones para añadir, actualizar y eliminar frases.
    *   Define un tipo `Phrase` en TypeScript que incluya `id`, `text`, `usage_count` y un array de `pictograms`. El tipo `Pictogram` debe tener `word` y `url`.
    *   Al seleccionar una frase, su `usage_count` debe incrementarse. La lista de sugerencias y la lista de gestión deben ordenarse para mostrar primero las frases más usadas.

4.  **Modal para Añadir/Editar Frases:**
    *   Crea un componente de modal (`PhraseEditorModal`) que se use tanto para crear como para editar frases.
    *   El modal debe contener un campo de texto para la frase y una interfaz para buscar y añadir pictogramas a la frase. Para este ejercicio, puedes simular la búsqueda de pictogramas o usar una lista predefinida.

5.  **Navegación y Estructura del Proyecto:**
    *   Usa **Expo Router** para la navegación entre la pantalla principal (`app/index.tsx`) y la de gestión (`app/manage-phrases.tsx`).
    *   La estructura de archivos debe ser lógica y escalable, con componentes reutilizables (ej: el modal) en una carpeta `src/components`.
    *   El layout principal (`app/_layout.tsx`) debe gestionar la carga de fuentes (como `Ionicons`) y mostrar una pantalla de carga mientras no estén listas.

**Stack tecnológico y librerías:**
*   React Native con Expo SDK
*   TypeScript
*   Expo Router para la navegación.
*   `@expo/vector-icons` para los iconos (específicamente Ionicons).
*   `expo-speech` para la funcionalidad de texto a voz.
*   `expo-font` para la carga de fuentes.

**Instrucciones adicionales:**
*   El código debe ser limpio, bien comentado y seguir las mejores prácticas de React y TypeScript.
*   La interfaz debe ser intuitiva y responsiva, utilizando componentes como `FlatList`, `TouchableOpacity` y `SafeAreaView`.
*   Asegúrate de manejar los estados de carga (`loading`) y los estados vacíos (cuando no hay frases o resultados de búsqueda).
