import { customElementVsCodePlugin } from 'custom-element-vs-code-integration';

export default {
	plugins: [
		customElementVsCodePlugin({
			cssFileName: 'p-slides.vscode.css-custom-data.json',
			htmlFileName: 'p-slides.vscode.html-custom-data.json',
			hideCssPropertiesDocs: true,
			hideCssPartsDocs: true
		})
	]
};
