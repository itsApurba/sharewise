import { Table, Text } from "@chakra-ui/react";
import { LuChartNoAxesColumn } from "react-icons/lu";
import EmptyState from "./ds/EmptyState";
import { ListSkeleton } from "./ds/Skeletons";
import Surface from "./ds/Surface";

/**
 * Top-5 table for the classic analytics screens. The ID column hides below md
 * so the table fits a phone without scrolling sideways.
 */
const AnalyticsTable = ({ query, rowKey, nameLabel, idKey, valueKey, valueLabel }) => {
  if (query.isLoading) return <ListSkeleton rows={5} />;
  if (query.isError) return <EmptyState title='Could not load these numbers' description='The server did not answer. Try again in a moment.' />;
  const rows = Array.isArray(query.data) ? query.data : [];
  if (rows.length === 0) return <EmptyState icon={<LuChartNoAxesColumn />} title='Nothing to rank yet' description='Numbers show up once there are posts.' />;

  return (
    <Surface p='0' overflow='hidden'>
      <Table.Root size='md' interactive>
        <Table.Header>
          <Table.Row bg='bg.subtle'>
            <Table.ColumnHeader w='10'>#</Table.ColumnHeader>
            <Table.ColumnHeader>{nameLabel}</Table.ColumnHeader>
            <Table.ColumnHeader display={{ base: "none", md: "table-cell" }}>ID</Table.ColumnHeader>
            <Table.ColumnHeader textAlign='end'>{valueLabel}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((row, i) => (
            <Table.Row key={row[rowKey]} bg='bg.panel'>
              <Table.Cell color='fg.muted' fontFamily='heading' fontWeight='600'>
                {i + 1}
              </Table.Cell>
              <Table.Cell fontWeight='600'>
                <Text overflowWrap='anywhere'>{row.name}</Text>
              </Table.Cell>
              <Table.Cell display={{ base: "none", md: "table-cell" }} fontFamily='mono' fontSize='xs' color='fg.muted'>
                {row[idKey]}
              </Table.Cell>
              <Table.Cell textAlign='end' fontWeight='700'>
                {row[valueKey]}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Surface>
  );
};

export default AnalyticsTable;
