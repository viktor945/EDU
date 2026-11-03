"use client";
import {Localized} from './admin-locale';
import {useInstitution,institutionLabels,institutionText} from '../institution-context';
import {allowedSections} from '../institutions';

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Eye,
  EyeOff,
  Filter,
  GripVertical,
  Images,
  LayoutGrid,
  ListChecks,
  Map,
  QrCode,
  Rows3,
  Save,
  Plus,
} from "lucide-react";
import {
  defaultSectionBlocks,
  defaultSectionLayout,
  type SectionBlock,
  type SectionLayout,
} from "../school-design";
import { sectionLabels as baseSectionLabels } from "../content-model";

const blockIcons: Record<string, typeof LayoutGrid> = {
  filters: Filter,
  content: LayoutGrid,
  plan: Map,
  rooms: ListChecks,
  contacts: CalendarDays,
  links: QrCode,
};

function sampleText(section: string, block: SectionBlock) {
  if (block.id === "filters") return "Поиск · Категория · Период";
  if (block.id === "plan") return "Схема этажа целиком";
  if (block.id === "rooms") return "101 · 102 · 103 · 201";
  if (block.id === "contacts") return "Телефон · Почта · Адрес";
  if (block.id === "links") return "Instagram · Telegram · YouTube";
  if (section === "schedule") return "Класс · День · Предмет · Учитель";
  if (section === "teachers") return "Фото · ФИО · Предмет · Классы";
  if (section === "menu") return "Завтрак · Обед · Полдник";
  return "Опубликованные карточки и изображения";
}

export default function SectionLayoutEditor({
  section,
  value,
  onSave,
  items = [],
}: {
  section: string;
  items?: {id: string; section: string; title: string}[];
  value?: SectionLayout;
  onSave: (value: SectionLayout) => Promise<void>;
}) {
  const makeLayout = () => ({
    ...defaultSectionLayout,
    ...value,
    blocks: (value?.blocks?.length
      ? value.blocks
      : defaultSectionBlocks(section)).map(b=>({...b,title:institutionText(b.title,type)})),
  });
  const type=useInstitution();const sectionLabels=Object.fromEntries(Object.entries(institutionLabels(type)).filter(([key])=>key!=='announcements'&&allowedSections(type).includes(key)));
  const [layout, setLayout] = useState<SectionLayout>(makeLayout);
  const [selected, setSelected] = useState("");
  const [dragged, setDragged] = useState("");
  const [saving, setSaving] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const inspect = (id: string) => {
    setSelected(id);
    if (window.matchMedia('(pointer: coarse), (max-width: 1024px)').matches)
      requestAnimationFrame(() => gridRef.current?.closest('section')?.querySelector('.section-block-inspector')?.scrollIntoView({behavior: 'smooth', block: 'start'}));
  };
  const addBlock = () => {
    const id = `custom-${Date.now()}`;
    setLayout(current => ({...current, blocks: [...current.blocks, {id, title: 'Новый блок', span: 6, height: 1, visible: true, sourceSection: section, recordIds: [], mode: 'cards'}]}));
    inspect(id);
  };

  useEffect(() => {
    const next = makeLayout();
    setLayout(next);
    setSelected(next.blocks.find((block) => block.visible)?.id || "");
  }, [section, value,type]);

  const patch = (next: Partial<SectionLayout>) =>
    setLayout((current) => ({ ...current, ...next }));
  const updateBlock = (id: string, next: Partial<SectionBlock>) =>
    setLayout((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === id ? { ...block, ...next } : block,
      ),
    }));
  const drop = (target: string) => {
    if (!dragged || dragged === target) return;
    setLayout((current) => {
      const blocks = [...current.blocks];
      const from = blocks.findIndex((block) => block.id === dragged);
      const to = blocks.findIndex((block) => block.id === target);
      const [moved] = blocks.splice(from, 1);
      blocks.splice(to, 0, moved);
      return { ...current, blocks };
    });
    setDragged("");
  };
  const moveBlock = (id: string, direction: -1 | 1) => {
    setLayout((current) => {
      const blocks = [...current.blocks];
      const from = blocks.findIndex((block) => block.id === id);
      const to = Math.max(0, Math.min(blocks.length - 1, from + direction));
      if (from < 0 || from === to) return current;
      const [moved] = blocks.splice(from, 1);
      blocks.splice(to, 0, moved);
      return { ...current, blocks };
    });
  };
  const resize = (
    event: React.PointerEvent,
    id: string,
    direction: "width" | "height",
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const block = layout.blocks.find((item) => item.id === id);
    const grid = gridRef.current;
    if (!block || !grid) return;
    const start = direction === "width" ? event.clientX : event.clientY;
    const initial = direction === "width" ? block.span : block.height;
    const unit =
      direction === "width" ? grid.getBoundingClientRect().width / 12 : 82;
    const move = (nextEvent: PointerEvent) => {
      const delta =
        direction === "width"
          ? nextEvent.clientX - start
          : nextEvent.clientY - start;
      updateBlock(
        id,
        direction === "width"
          ? {
              span: Math.max(
                3,
                Math.min(12, initial + Math.round(delta / unit)),
              ),
            }
          : {
              height: Math.max(
                1,
                Math.min(3, initial + Math.round(delta / unit)),
              ),
            },
      );
    };
    const done = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", done);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", done);
  };
  const save = async () => {
    setSaving(true);
    try {
      await onSave(layout);
    } finally {
      setSaving(false);
    }
  };
  const current = layout.blocks.find((block) => block.id === selected);

  return (
    <Localized as="section" className="section-layout-editor section-block-builder">
      <Localized as="div" className="section-layout-head">
        <Localized as="div">
          <Localized as="p">Визуальный редактор раздела</Localized>
          <Localized as="h3">{sectionLabels[section]}</Localized>
          <Localized as="span">
            Перетаскивайте реальные зоны раздела и меняйте их ширину и высоту.
          </Localized>
        </Localized>
        <Localized as="button" className="owner-secondary" onClick={addBlock}><Plus size={16} /> Добавить блок</Localized>
        <Localized as="button" className="owner-primary" disabled={saving} onClick={save}>
          <Save size={16} />
          {saving ? "Сохранение…" : "Сохранить вид"}
        </Localized>
      </Localized>
      <Localized as="div" className="section-builder-body">
        <Localized as="div" className="section-builder-stage">
          <Localized as="header">
            <Localized as="strong">{sectionLabels[section]}</Localized>
            <Localized as="span">Так раздел будет выглядеть на портале</Localized>
          </Localized>
          <Localized as="div" className="section-block-grid" ref={gridRef}>
            {layout.blocks
              .filter((block) => block.visible)
              .map((block) => {
                const Icon = blockIcons[block.id] || Images;
                return (
                  <Localized as="article"
                    draggable
                    className={`section-preview-block block-${block.id} ${selected === block.id ? "selected" : ""}`}
                    style={{
                      gridColumn: `span ${block.span}`,
                      gridRow: `span ${block.height}`,
                    }}
                    key={block.id}
                    onClick={() => inspect(block.id)}
                    onDragStart={() => setDragged(block.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => drop(block.id)}
                  >
                    <GripVertical className="section-drag" size={16} />
                    <Localized as="div" className="section-block-visual">
                      <Icon size={block.id === "plan" ? 34 : 23} />
                      {block.id === "plan" && <Localized as="span" className="plan-lines" />}
                      {block.id === "rooms" && (
                        <Localized as="span" className="room-chips">
                          <Localized as="i" />
                          <Localized as="i" />
                          <Localized as="i" />
                          <Localized as="i" />
                        </Localized>
                      )}
                    </Localized>
                    <Localized as="div">
                      <Localized as="strong">{block.title}</Localized>
                      <Localized as="small">{sampleText(section, block)}</Localized>
                    </Localized>
                    <Localized as="span"
                      className="section-resize-width"
                      title="Изменить ширину"
                      onPointerDown={(event) =>
                        resize(event, block.id, "width")
                      }
                    />
                    <Localized as="span"
                      className="section-resize-height"
                      title="Изменить высоту"
                      onPointerDown={(event) =>
                        resize(event, block.id, "height")
                      }
                    />
                  </Localized>
                );
              })}
          </Localized>
        </Localized>
        {current ? (
          <Localized as="aside" className="section-block-inspector">
            <Localized as="button" className="owner-secondary" onClick={() => gridRef.current?.scrollIntoView({behavior: 'smooth', block: 'center'})}>Вернуться к блокам</Localized>
            <Localized as="div">
              <Localized as="strong">Настройка блока</Localized>
              <Localized as="span">{Math.round((current.span / 12) * 100)}%</Localized>
            </Localized>
            <Localized as="div" className="mobile-block-order">
              <Localized as="button" onClick={() => moveBlock(current.id, -1)}>
                <ArrowUp size={17} /> Выше
              </Localized>
              <Localized as="button" onClick={() => moveBlock(current.id, 1)}>
                <ArrowDown size={17} /> Ниже
              </Localized>
            </Localized>
            <Localized as="label">
              Название блока
              <Localized as="input"
                value={current.title}
                onChange={(event) =>
                  updateBlock(current.id, { title: event.target.value })
                }
              />
            </Localized>
            <Localized as="label">
              Ширина
              <Localized as="div" className="section-size-buttons">
                {[
                  [3, "25%"],
                  [4, "33%"],
                  [6, "50%"],
                  [8, "67%"],
                  [12, "100%"],
                ].map(([span, label]) => (
                  <Localized as="button"
                    className={current.span === span ? "active" : ""}
                    key={span}
                    onClick={() =>
                      updateBlock(current.id, { span: Number(span) })
                    }
                  >
                    {label}
                  </Localized>
                ))}
              </Localized>
            </Localized>
            {current.id.startsWith('custom-') && <>
              <Localized as="label">Контент из раздела<Localized as="select" value={current.sourceSection || section} onChange={e => updateBlock(current.id, {sourceSection: e.target.value, recordIds: []})}>{Object.entries(sectionLabels).filter(([key]) => key !== 'home').map(([key, title]) => <Localized as="option" key={key} value={key}>{title}</Localized>)}</Localized></Localized>
              <Localized as="label">Отображение<Localized as="select" value={current.mode || 'cards'} onChange={e => updateBlock(current.id, {mode: e.target.value as SectionBlock['mode']})}><Localized as="option" value="cards">Карточки с изображениями</Localized><Localized as="option" value="list">Список</Localized><Localized as="option" value="compact">Только заголовки</Localized></Localized></Localized>
              <Localized as="fieldset" className="block-record-picker"><Localized as="legend">Материалы (без выбора — все опубликованные)</Localized>{items.filter(item => item.section === (current.sourceSection || section)).map(item => <Localized as="label" key={item.id}><Localized as="input" type="checkbox" checked={current.recordIds?.includes(item.id) || false} onChange={e => updateBlock(current.id, {recordIds: e.target.checked ? [...(current.recordIds || []), item.id] : current.recordIds?.filter(id => id !== item.id)})} />{item.title}</Localized>)}</Localized>
            </>}
            <Localized as="label">
              Высота
              <Localized as="div" className="section-size-buttons three">
                {[
                  [1, "Обычная"],
                  [2, "Высокая"],
                  [3, "Максимальная"],
                ].map(([height, label]) => (
                  <Localized as="button"
                    className={current.height === height ? "active" : ""}
                    key={height}
                    onClick={() =>
                      updateBlock(current.id, { height: Number(height) })
                    }
                  >
                    {label}
                  </Localized>
                ))}
              </Localized>
            </Localized>
            <Localized as="button"
              className="owner-secondary section-visibility"
              onClick={() => updateBlock(current.id, { visible: false })}
            >
              <EyeOff size={16} /> Скрыть блок
            </Localized>
            <Localized as="div" className="section-display-settings">
              <Localized as="label">
                Карточек в строке
                <Localized as="div" className="section-size-buttons four">
                  {[1, 2, 3, 4].map((columns) => (
                    <Localized as="button"
                      className={layout.columns === columns ? "active" : ""}
                      key={columns}
                      onClick={() => patch({ columns })}
                    >
                      {columns}
                    </Localized>
                  ))}
                </Localized>
              </Localized>
              <Localized as="label">
                Карточки внутри блока
                <Localized as="select"
                  value={layout.mode}
                  onChange={(event) =>
                    patch({ mode: event.target.value as SectionLayout["mode"] })
                  }
                >
                  <Localized as="option" value="cards">Карточки</Localized>
                  <Localized as="option" value="list">Список</Localized>
                  <Localized as="option" value="compact">Компактные</Localized>
                </Localized>
              </Localized>
              <Localized as="label">
                Изображения
                <Localized as="select"
                  value={layout.imageFit}
                  onChange={(event) =>
                    patch({
                      imageFit: event.target.value as SectionLayout["imageFit"],
                    })
                  }
                >
                  <Localized as="option" value="cover">Заполнять карточку</Localized>
                  <Localized as="option" value="contain">Показывать целиком</Localized>
                </Localized>
              </Localized>
            </Localized>
          </Localized>
        ) : (
          <Localized as="aside" className="section-block-inspector empty">
            <Rows3 size={28} />
            <Localized as="strong">Выберите блок</Localized>
          </Localized>
        )}
      </Localized>
      {layout.blocks.some((block) => !block.visible) && (
        <Localized as="div" className="hidden-section-blocks">
          <Localized as="span">Скрытые блоки:</Localized>
          {layout.blocks
            .filter((block) => !block.visible)
            .map((block) => (
              <Localized as="button"
                key={block.id}
                onClick={() => updateBlock(block.id, { visible: true })}
              >
                <Eye size={15} /> {block.title}
              </Localized>
            ))}
        </Localized>
      )}
    </Localized>
  );
}
