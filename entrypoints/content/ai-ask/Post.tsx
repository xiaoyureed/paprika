import ModalHeader from '@/components/ModalHeader'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemTitle,
} from '@/components/ui/item'
import { useStorage } from '../../hooks/useStorage'
import { STORAGE_KEYS } from '@/utils/constants'
import { ScrollArea } from '@/components/ui/scroll-area'

const Post: React.FC<{
  children?: React.ReactNode
  onRemove?: () => void
}> = ({ onRemove }) => {
  const [formData, setFormData] = useStorage<FormData>(STORAGE_KEYS.formData)

  console.debug(formData, typeof formData + ' <-- formData')
  const postData = [
    {
      id: 1,
      tag: 'tech',
      title: '前端工程化最佳实践总结',
      description:
        '梳理Vite项目搭建、组件封装与性能优化实用技巧，适配主流业务开发场景',
      score: 216,
      comments: 47,
    },
    {
      id: 2,
      tag: 'life',
      title: '上班族高效日常作息规划',
      description: '平衡工作与休息，简单易执行的居家生活调节小方法',
      score: 153,
      comments: 29,
    },
    {
      id: 3,
      tag: 'travel',
      title: '小众短途出游游玩攻略',
      description: '避开人流热门景点，分享性价比高的周边出行路线与打卡地点',
      score: 289,
      comments: 63,
    },
    {
      id: 4,
      tag: 'food',
      title: '家常简易减脂餐做法',
      description: '少油清淡做法，食材常见省时，适合日常居家制作',
      score: 197,
      comments: 35,
    },
    {
      id: 5,
      tag: 'study',
      title: '零基础自学编程入门心得',
      description: '分享从零开始学习代码的学习路径与避坑经验',
      score: 142,
      comments: 21,
    },
    {
      id: 5,
      tag: 'study',
      title: '零基础自学编程入门心得',
      description: '分享从零开始学习代码的学习路径与避坑经验',
      score: 142,
      comments: 21,
    },
    {
      id: 5,
      tag: 'study',
      title: '零基础自学编程入门心得',
      description: '分享从零开始学习代码的学习路径与避坑经验',
      score: 142,
      comments: 21,
    },
    {
      id: 5,
      tag: 'study',
      title: '零基础自学编程入门心得',
      description: '分享从零开始学习代码的学习路径与避坑经验',
      score: 142,
      comments: 21,
    },
  ]
  return (
    <div className="flex flex-col h-full px-4 py-2 bg-background rounded-xl">
      <ModalHeader
        title="Post"
        onRemove={onRemove}
        className="shrink-0 mb-2"
      />

      <ScrollArea className="flex-1 overflow-y-auto border-t border-dashed">
        <div className="space-y-3 ">
          {postData.map((it, i) => (
            <Item key={i} className="hover:bg-secondary">
              <ItemHeader>
                <p>{it.tag}</p>
              </ItemHeader>
              <ItemContent>
                <ItemTitle>{it.title}</ItemTitle>
                <ItemDescription>{it.description}</ItemDescription>
              </ItemContent>
              <ItemFooter>
                <div className="flex justify-start items-center gap-x-3 text-gray-500 text-[.7rem]">
                  <p>{`Score: ${it.score}`}</p>
                  <p>{`Comments: ${it.comments}`}</p>
                </div>
              </ItemFooter>
            </Item>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export default Post
