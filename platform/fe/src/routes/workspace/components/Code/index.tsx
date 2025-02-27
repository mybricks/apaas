 import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { basicSetup } from 'codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { ayuLight } from 'thememirror';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

// 定义 ref 暴露的接口
export interface CodeMirrorRef {
  view: EditorView | null;
  // 可以在这里添加更多你想暴露的方法
  getValue: () => string;
  setValue: (value: string) => void;
}

interface CodeMirrorProps {
  value: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  height?: string | number;
  language?: 'json';
}

const CodeMirror: React.FC<CodeMirrorProps> = forwardRef<CodeMirrorRef, CodeMirrorProps>(({ 
  value, 
  readOnly = true,
  onChange,
  language,
  height = '100%'
}, ref) => {
  const editorRef = useRef(null);
  const editorViewRef = useRef<EditorView | null>(null);

  const [mountd, setMounted] = useState(false)

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    view: editorViewRef.current,
    getValue: () => {
      return editorViewRef.current?.state.doc.toString() || '';
    },
    setValue: (newValue: string) => {
      if (editorViewRef.current) {
        const transaction = editorViewRef.current.state.update({
          changes: {
            from: 0,
            to: editorViewRef.current.state.doc.length,
            insert: newValue
          }
        });
        editorViewRef.current.dispatch(transaction);
      }
    }
  }), [mountd]);

  useEffect(() => {
    // 初始化CodeMirror编辑器
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        ayuLight,
        json(),
        EditorState.readOnly.of(readOnly),
        // 添加语法高亮
        syntaxHighlighting(defaultHighlightStyle),
      ],
    });
    const editor = new EditorView({
      state,
      parent: editorRef.current,
    });

    editorViewRef.current = editor;

    setMounted(true)

    return () => {
      editor.destroy(); // 注意：此后此处要随组件销毁
    };
  }, []);

  // 监听 value 变化，更新编辑器内容
  useEffect(() => {
    if (editorViewRef.current) {
      const transaction = editorViewRef.current.state.update({
        changes: {
          from: 0,
          to: editorViewRef.current.state.doc.length,
          insert: value
        }
      });
      editorViewRef.current.dispatch(transaction);
    }
  }, [value]);

  return <div style={{ height, overflow: 'auto' }} ref={editorRef}></div>;
});

export default CodeMirror;
