import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { useTranslation } from 'react-i18next';
import {
    Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight,
    AlignJustify, List, ListOrdered, Undo, Redo, Type, Indent, Outdent, 
    MoreHorizontal, ChevronDown, ChevronsUpDown
} from 'lucide-react';
import { Extension } from '@tiptap/core';

// ─── Mẫu văn bản hành chính ───────────────────────────────────────────────
// Sử dụng <table> để TipTap giữ nguyên bố cục 2 cột
export const DOCUMENT_TEMPLATE = `
<table style="width:100%; border-collapse:collapse; border:none; margin-bottom:0;">
  <tbody>
    <tr>
      <td style="width:35%; text-align:center; vertical-align:top; border:none; padding:8px 0;">
        <p style="margin:0; font-size:12pt; font-weight:bold;">CÔNG TY CP BỆNH VIỆN </p>
        <p style="margin:0; font-size:12pt; font-weight:bold;">ĐA KHOA TÂM TRÍ CAO LÃNH</p>
        <hr width="80" style="width:80px; border-top:1px solid black; margin:8px auto;" />
        <p style="margin:0; font-size:12pt;">Số: ......../........</p>
      </td>
      <td style="width:65%; text-align:center; vertical-align:top; border:none; padding:8px 0;">
        <p style="margin:0; font-size:12pt; font-weight:bold; white-space:nowrap;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p style="margin:0; font-size:12pt; font-weight:bold;">Độc lập - Tự do - Hạnh phúc</p>
        <hr width="80" style="width:80px; border-top:1px solid black; margin:8px auto;" />
        <p style="margin:0; font-size:12pt; font-style:italic;">........, ngày .... tháng .... năm 20....</p>
      </td>
    </tr>
  </tbody>
</table>

<p style="text-align:center; font-size:12pt; font-weight:bold; margin:40px 0 8px 0;">[TÊN LOẠI VĂN BẢN]</p>
<p style="text-align:center; font-size:12pt; font-weight:bold; font-style:italic; margin:0 0 32px 0;">Về việc [Trích yếu nội dung văn bản]</p>

<p style="margin:0 0 80px 0; text-align:justify;">[Nội dung văn bản bắt đầu từ đây...]</p>

<table style="width:100%; border-collapse:collapse; border:none; margin-top:40px;">
  <tbody>
    <tr>
      <td style="width:45%; text-align:left; vertical-align:top; border:none; padding:0 12px 0 0;">
        <p style="margin:0; font-size:12pt; font-weight:bold; font-style:italic;">Nơi nhận:</p>
        <p style="margin:4px 0 0 0; font-size:12pt;">- Như trên;</p>
        <p style="margin:2px 0 0 0; font-size:12pt;">- Lưu: VT, ...</p>
      </td>
      <td style="width:55%; text-align:center; vertical-align:top; border:none; padding:0 0 0 12px;">
        <p style="margin:0; font-size:12pt; font-weight:bold;">GIÁM ĐỐC</p>
        <p style="margin:2px 0 0 0; font-size:12pt; font-style:italic;">(Ký và đóng dấu)</p>
        <p style="margin:100px 0 0 0; font-size:12pt; font-weight:bold;">[Họ và tên]</p>
      </td>
    </tr>
  </tbody>
</table>
`;

// ─── Toolbar Button ────────────────────────────────────────────────────────
const ToolbarBtn = ({ onClick, active, disabled, title, children }) => (
    <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        disabled={disabled}
        title={title}
        className={`p-1.5 rounded text-sm transition-all ${active
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
        {children}
    </button>
);

const ToolbarDivider = () => <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />;

// ─── TextEditor Component ──────────────────────────────────────────────────
const CustomHorizontalRule = HorizontalRule.extend({
    addAttributes() {
        return {
            style: {
                default: null,
                parseHTML: element => element.getAttribute('style'),
                renderHTML: attributes => {
                    if (!attributes.style) return {};
                    return { style: attributes.style };
                },
            },
            width: {
                default: null,
                parseHTML: element => element.getAttribute('width'),
                renderHTML: attributes => {
                    if (!attributes.width) return {};
                    return { width: attributes.width };
                },
            },
        };
    },
});

// ─── Custom Extensions ───────────────────────────────────────────────────

const LineHeight = Extension.create({
    name: 'lineHeight',
    addOptions() {
        return {
            types: ['paragraph', 'heading'],
            defaultLineHeight: '1.5',
        };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    lineHeight: {
                        default: null,
                        renderHTML: attributes => {
                            if (!attributes.lineHeight) return {};
                            return { style: `line-height: ${attributes.lineHeight}` };
                        },
                        parseHTML: element => element.style.lineHeight || null,
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setLineHeight: (lineHeight) => ({ commands }) => {
                return this.options.types.every(type => commands.updateAttributes(type, { lineHeight }));
            },
        };
    },
});

const ParagraphSpacing = Extension.create({
    name: 'paragraphSpacing',
    addOptions() {
        return {
            types: ['paragraph', 'heading'],
        };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    marginBottom: {
                        default: null,
                        renderHTML: attributes => {
                            if (!attributes.marginBottom) return {};
                            return { style: `margin-bottom: ${attributes.marginBottom}` };
                        },
                        parseHTML: element => element.style.marginBottom || null,
                    },
                    marginTop: {
                        default: null,
                        renderHTML: attributes => {
                            if (!attributes.marginTop) return {};
                            return { style: `margin-top: ${attributes.marginTop}` };
                        },
                        parseHTML: element => element.style.marginTop || null,
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setParagraphSpacing: (margin) => ({ commands }) => {
                return this.options.types.every(type => commands.updateAttributes(type, { marginBottom: margin }));
            },
        };
    },
});

const TextIndent = Extension.create({
    name: 'textIndent',
    addOptions() {
        return {
            types: ['paragraph'],
            indentSize: '1.27cm', // Chuẩn văn bản hành chính VN
        };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    textIndent: {
                        default: null,
                        renderHTML: attributes => {
                            if (!attributes.textIndent) return {};
                            return { style: `text-indent: ${attributes.textIndent}` };
                        },
                        parseHTML: element => element.style.textIndent || null,
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setTextIndent: (indent) => ({ commands }) => {
                return this.options.types.every(type => commands.updateAttributes(type, { textIndent: indent }));
            },
            toggleIndent: () => ({ commands, editor }) => {
                const currentIndent = editor.getAttributes('paragraph').textIndent;
                return commands.updateAttributes('paragraph', { textIndent: currentIndent ? null : this.options.indentSize });
            },
        };
    },
});

const TextEditor = ({ value, onChange, placeholder }) => {
    const { t } = useTranslation();

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                horizontalRule: false, // Disable default HR to use custom one
            }),
            CustomHorizontalRule,
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            TextAlign.configure({ types: ['heading', 'paragraph', 'tableCell', 'tableHeader'] }),
            Underline,
            TextStyle,
            Color,
            FontFamily,
            LineHeight,
            ParagraphSpacing,
            TextIndent,
        ],
        content: value || DOCUMENT_TEMPLATE,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'tiptap-a4-page',
                style: 'font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5;',
            },
        },
    }, []);

    // Sync external value changes (e.g. template reset)
    // Only update if value changes from outside and differs from editor content
    if (editor && value && value !== editor.getHTML() && value === DOCUMENT_TEMPLATE) {
        editor.commands.setContent(value, false);
    }

    if (!editor) return null;

    return (
        <div className="document-editor border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-900">
            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">

                {/* History */}
                <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
                    <Undo size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
                    <Redo size={15} />
                </ToolbarBtn>
                <ToolbarDivider />

                {/* Heading */}
                <select
                    className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    value={
                        editor.isActive('heading', { level: 1 }) ? '1' :
                            editor.isActive('heading', { level: 2 }) ? '2' :
                                editor.isActive('heading', { level: 3 }) ? '3' : '0'
                    }
                    onChange={(e) => {
                        const v = parseInt(e.target.value);
                        if (v === 0) editor.chain().focus().setParagraph().run();
                        else editor.chain().focus().toggleHeading({ level: v }).run();
                    }}
                >
                    <option value="0">Heading</option>
                    <option value="1">Heading 1</option>
                    <option value="2">Heading 2</option>
                    <option value="3">Heading 3</option>
                </select>
                <ToolbarDivider />

                {/* Text style */}
                <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
                    <Bold size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
                    <Italic size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
                    <UnderlineIcon size={15} />
                </ToolbarBtn>
                <ToolbarDivider />

                {/* Alignment */}
                <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Căn trái">
                    <AlignLeft size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Căn giữa">
                    <AlignCenter size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Căn phải">
                    <AlignRight size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Căn đều">
                    <AlignJustify size={15} />
                </ToolbarBtn>
                <ToolbarDivider />

                {/* Lists */}
                <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Danh sách">
                    <List size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Danh sách số">
                    <ListOrdered size={15} />
                </ToolbarBtn>
                <ToolbarDivider />

                {/* Spacing & Indent */}
                <div className="flex items-center gap-1 group relative">
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleIndent().run()} active={!!editor.getAttributes('paragraph').textIndent} title="Thụt đầu dòng (1.27cm)">
                        <Indent size={15} />
                    </ToolbarBtn>
                </div>

                <div className="flex items-center gap-1 ml-1" title="Cách hàng">
                    <ChevronDown size={12} className="text-gray-400" />
                    <select
                        className="text-[10px] px-1 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none"
                        value={editor.getAttributes('paragraph').lineHeight || '1.5'}
                        onChange={(e) => editor.chain().focus().setLineHeight(e.target.value).run()}
                    >
                        <option value="1.0">1.0</option>
                        <option value="1.15">1.15</option>
                        <option value="1.5">1.5</option>
                        <option value="2.0">2.0</option>
                    </select>
                </div>

                <div className="flex items-center gap-1 ml-1" title="Cách đoạn">
                    <ChevronsUpDown size={13} className="text-gray-400" />
                    <select
                        className="text-[10px] px-1 py-0.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none"
                        value={editor.getAttributes('paragraph').marginBottom || '0pt'}
                        onChange={(e) => editor.chain().focus().setParagraphSpacing(e.target.value).run()}
                    >
                        <option value="0pt">0pt</option>
                        <option value="6pt">6pt</option>
                        <option value="12pt">12pt</option>
                        <option value="18pt">18pt</option>
                    </select>
                </div>

                <ToolbarDivider />

                {/* Font size rough equivalent via heading hint */}
                <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-1 flex items-center gap-1">
                    <Type size={12} /> Times New Roman
                </span>
            </div>

            {/* ── Editor Content ── */}
            <div className="a4-editor-canvas max-h-[750px]">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default TextEditor;
