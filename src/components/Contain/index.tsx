import {
  ref,
  provide,
  inject,
  computed,
  defineComponent,
  type CSSProperties,
  type ExtractPropTypes,
  type InjectionKey,
} from 'vue'
import { useElementSize, useFullscreen } from '@vueuse/core'
import './style.scss'

export const containProps = {
  width: { type: Number, default: 1920 },
  height: { type: Number, default: 1080 },
  background: { type: String },
  standard: { type: [Boolean, String], default: false },
  blur: Boolean,
  dev: Boolean,
  backgroundToFullscreen: Boolean,
}

export type ContainProps = ExtractPropTypes<typeof containProps>

export interface ContainStyle {
  fixed: boolean,
  width: number,
  height: number,
  left: number,
  top: number,
  right: number,
  bottom: number
}

function getPercentage(total: number, value?: number) {
  if (!value) return
  return `${(value / total * 100)}%`
}
export function getStyle(style: CSSProperties & Partial<ContainStyle>, dev = false, width = 1920, height = 1080) {
  return {
    outline: dev ? 'red dashed 5px' : undefined,
    position: style.fixed ? 'fixed' : 'absolute',
    ...style,
    width: getPercentage(width, style.width),
    height: getPercentage(height, style.height),
    left: getPercentage(width, style.left),
    right: getPercentage(width, style.right),
    top: getPercentage(height, style.top),
    bottom: getPercentage(height, style.bottom),
  } as CSSProperties
}

export const containInjectKey: InjectionKey<typeof getStyle> = Symbol('contain')
export const useGetStyle = () => inject(containInjectKey, getStyle)

export default defineComponent({
  name: 'OContain',
  props: containProps,
  setup(props) {
    const containRef = ref<HTMLDivElement>()
    const { width, height } = useElementSize(containRef)
    const { toggle } = useFullscreen(containRef)

    const scale = computed(() => {
      if (props.standard === 'width') return width.value / props.width
      if (props.standard === 'height') return height.value / props.height
      return Math.min(width.value / props.width, height.value / props.height)
    })

    const standardWidth = computed(() => width.value / scale.value)
    const standardHeight = computed(() => height.value / scale.value)

    function getComponentStyle(style: CSSProperties & Partial<ContainStyle>, dev?: boolean, width?: number, height?: number) {
      return getStyle(style, dev ?? props.dev, width ?? props.width, height ?? props.height)
    }

    provide(containInjectKey, getStyle)

    return {
      containRef,
      scale,
      getStyle: getComponentStyle,
      toggleFullscreen: toggle,
      standardWidth,
      standardHeight,
    }
  },
  render() {
    return (
      <div ref="containRef" class="o-contain">
        {
          this.blur && this.background && (
            <div
              class={['o-contain-background', { blur: this.blur }]}
              style={{ background: this.background }}
              onDblclick={() => {
                if (this.backgroundToFullscreen) this.toggleFullscreen()
              }}
            />
          )
        }
        <div
          class={'o-contain-wrapper'}
          style={{
            width: this.standard === 'height' ? this.standardWidth + 'px' : this.width + 'px',
            height: this.standard === 'width' ? this.standardHeight + 'px' : this.height + 'px',
            transform: `scale(${this.scale})`,
            background: this.background,
          }}
        >
          {this.$slots.default?.({ getStyle: this.getStyle })}
        </div>
      </div>
    )
  },
})