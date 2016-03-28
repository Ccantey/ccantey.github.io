<?php
//$cloud = $_GET['x'];
//var z = 'a';
//test.php?x= + z

mysql_connect("localhost", "geoodyss_admin", "Aiden0701");
mysql_select_db("geoodyss_tiny") or die(mysql_error());
// Check connection
$result = mysql_query("SELECT * FROM sandy3");

$data=array();
while($row =mysql_fetch_array($result, MYSQL_ASSOC)){
	$data[]=$row;
}
echo json_encode($data);

?>
